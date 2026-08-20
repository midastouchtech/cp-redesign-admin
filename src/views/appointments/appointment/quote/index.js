import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DOVER_PRICE, XRAYS_PRICE, MEDICAL_SERVICES } from '../../../../config';
import { keys, values } from 'ramda';
import styled from 'styled-components';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';
import axios from 'axios';
import moment from 'moment';
import { trackEvent } from '../../../../lib/trackEvent';

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

const formatPrice = (price) => {
  return `R ${(price ?? 0).toFixed(2)}`;
};

// html2canvas scale heuristic: more employees/service-lines means a taller rendered
// #quote-container, and jspdf's .html() renders the whole element at a fixed page width — a
// large, tall invoice at a high scale produces a huge canvas (slow, sometimes OOMs the tab) while
// a tiny 1-employee invoice at the old fixed 0.36 renders unnecessarily blurry. Scale down as
// employee count grows, floor at 0.22 so very large bookings still render (just smaller/denser),
// ceiling at 0.5 so small bookings look crisper than the old fixed 0.36 default.
// Thresholds (employee count -> scale): <=5: 0.5, <=15: 0.36 (old default), <=30: 0.28, >30: 0.22.
function getHtml2CanvasScale(employeeCount) {
  const count = employeeCount || 0;
  if (count <= 5) return 0.5;
  if (count <= 15) return 0.36;
  if (count <= 30) return 0.28;
  return 0.22;
}

const StyedContainer = styled.div`
  @media print {
    #printPageButton {
      display: none;
    }
    h1, h2, h3, h4, h5, h6 {
      color: black !important;
    }
  }
  .quote-container {
    border: 1px solid #lightgrey;
  }
  p {
    padding: 0 !important;
  }
  background-color: #fff;
  img {
    width: 100%;
  }
  h5 {
    padding: 10px 0;
  }
  td,
  th {
    padding: 5px !important;
    font-size: 12px;
  }
  .details-row {
    p {
      padding: 0 !important;
      margin: 0 !important;
    }
  }
  .section-header td {
    padding: 10px 0 4px !important;
    border: none !important;
  }
  .section-header h3,
  .section-header h5 {
    margin: 0;
  }
  .grand-total-row td {
    border-top: 2px solid #333 !important;
    padding-top: 10px !important;
  }
  tr {
    &:last-of-type {
      td {
        border: none;
      }
    }
  }
  h1, h2, h3, h4, h5, h6 {
    color: black !important;
  }
`;

function App({ socket }) {
  let params = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState({});
  const [services, setServices] = useState([]);
  const [servicesPrice, setServicesPrice] = useState(0);
  const [company, setCompany] = useState({});
  const [disableButton, setButtonDisabled] = useState(false);
  const [status, setStatus] = useState('Email Invoice');
  const [serviceCounts, setServiceCounts] = useState({});
  const [doverCount, setDoverCount] = useState(0);
  const [doverPrice, setDoverPrice] = useState(0);
  const [xrayCount, setXrayCount] = useState(0);
  const [xrayPrice, setXrayPrice] = useState(0);

  // Authoritative amount/invoice-number/subtotals, fetched from cp-companion's
  // GET /api/admin/invoices/compute — replaces the client-side recomputation from
  // appointment.details.employees that used to feed formatPrice/the totals row. The socket-fetched
  // appointment is still used for everything non-price (dates, PO number, company/employee names).
  const [invoiceNumber, setInvoiceNumber] = useState(null);
  const [computedBreakdown, setComputedBreakdown] = useState(null);
  const [computeLoading, setComputeLoading] = useState(true);

  useEffect(() => {
    if (!params.appId || !COMPANION_API_URL) return;
    setComputeLoading(true);
    fetch(
      `${COMPANION_API_URL}/api/admin/invoices/compute?appointmentId=${encodeURIComponent(params.appId)}`,
      { headers: { 'x-admin-stats-secret': COMPANION_STATS_SECRET || '' } }
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`compute failed: ${res.status}`))))
      .then((data) => {
        setInvoiceNumber(data.invoiceId);
        setComputedBreakdown(data.servicesBreakdown);
      })
      .catch((err) => {
        console.warn('[quote] failed to fetch authoritative invoice amount', err);
      })
      .finally(() => setComputeLoading(false));
  }, [params.appId]);

  const employeeCount = appointment?.details?.employees?.length || 0;
  const html2canvasScale = getHtml2CanvasScale(employeeCount);

  // Grand total shown on the totals row: prefer the authoritative computed value from
  // cp-companion; fall back to the (legacy, client-recomputed) servicesPrice+doverPrice+xrayPrice
  // only while the compute call hasn't returned yet, so the page still renders something
  // reasonable during the brief loading window rather than blank.
  const grandTotal = computedBreakdown
    ? computedBreakdown.grandTotal
    : servicesPrice + doverPrice + xrayPrice;

  const savetopdf = () => {
    window.scrollTo(0, 0);
    const input = document.getElementById('quote-container');

    // Force all headings to be black by setting inline styles
    const headings = input.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const originalStyles = [];
    headings.forEach((heading, index) => {
      originalStyles[index] = heading.style.color || '';
      heading.style.color = 'black';
    });

    var doc = new jspdf('p', 'px', 'a4');
    doc.html(input, {
      callback: function (pdf) {
        // Restore original styles
        headings.forEach((heading, index) => {
          if (originalStyles[index]) {
            heading.style.color = originalStyles[index];
          } else {
            heading.style.color = '';
          }
        });
        pdf.save('clincplus-quote.pdf');
      },
      html2canvas: {
        scale: html2canvasScale,
      },
      x: 20,
      y: 20,
    });
  };

  const uploadToCloudinary = () => {
    setButtonDisabled(true);
    setStatus('Generating invoice...');
    window.scrollTo(0, 0);
    window.scrollTo(0, 0);
    const input = document.getElementById('quote-container');

    // Force all headings to be black by setting inline styles
    const headings = input.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const originalStyles = [];
    headings.forEach((heading, index) => {
      originalStyles[index] = heading.style.color || '';
      heading.style.color = 'black';
    });

    var doc = new jspdf('p', 'px', 'a4');
    doc.html(input, {
      callback: function (pdf) {
        // Restore original styles
        headings.forEach((heading, index) => {
          if (originalStyles[index]) {
            heading.style.color = originalStyles[index];
          } else {
            heading.style.color = '';
          }
        });
        var blob = pdf.output('blob');
        const url = `${process.env.REACT_APP_IO_SERVER}/upload-file-to-cloud-storage`;
        const formData = new FormData();
        formData.append('file', blob, 'quote.pdf');
        setStatus('Uploading invoice...');
        axios({
          method: 'POST',
          data: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
          url,
        })
          .then((response) => {
            const pdfUrl = response.data.publicUrl;
            const stableInvoiceId = invoiceNumber || appointment.id;

            // Legacy SEND_INVOICE is deliberately NOT emitted anymore — its handler
            // (saveNewInvoice in the legacy server) already emails the client itself
            // (sendNewInvoiceEmail), confirmed by reading that repo's code read-only. Emitting it
            // alongside POST /api/admin/invoices (which also emails the client via Mailjet) meant
            // every invoice send double-emailed the client. cp-companion's endpoint below is now
            // the sole source of both the durable invoice record and the client email; the legacy
            // server's own invoices collection simply stops receiving new rows going forward
            // (confirmed nothing else in this repo or cp-companion reads from it).
            setStatus('Sending...');

            if (!COMPANION_API_URL) {
              setStatus('Error sending invoice');
              return;
            }

            fetch(`${COMPANION_API_URL}/api/admin/invoices`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-stats-secret': COMPANION_STATS_SECRET || '',
              },
              body: JSON.stringify({
                appointmentId: appointment?.id,
                invoiceId: stableInvoiceId,
                pdfUrl,
              }),
            })
              .then((res) => {
                if (!res.ok) throw new Error(`cp-companion invoice record failed: ${res.status}`);
                setStatus('Invoice sent!');
                // Note: 'invoice_sent' is a free-form action string, not one of the
                // contract's enumerated actions ('message_sent' etc) — kept distinct
                // deliberately since an invoice send is a more specific/meaningful
                // event than a generic chat message for timeline readers.
                trackEvent({
                  entityType: 'appointment',
                  entityId: appointment?.id,
                  action: 'invoice_sent',
                  metadata: { invoiceId: stableInvoiceId, url: pdfUrl },
                });
              })
              .catch((err) => {
                console.warn('[quote] failed to record invoice in cp-companion', err);
                setStatus('Error sending invoice');
              });
          })
          .catch((errr) => setStatus('Error sending invoice'));
      },
      html2canvas: {
        scale: html2canvasScale,
      },
      x: 20,
      y: 20,
    });
  };

  if (socket && isLoading) {
    socket.emit('GET_APPOINTMENT', { id: params.appId });
    socket.on('RECEIVE_COMPANY', (data) => {
      setCompany(data);
    });
    socket.on('RECEIVE_APPOINTMENT', (appointment) => {
      socket.emit('GET_COMPANY', { id: appointment?.details?.company?.id });
      setIsLoading(false);
      setAppointment(appointment);
      const allServicesWithVienna = appointment?.details?.employees?.reduce(
        (acc, employee) => {
          return [...acc, ...employee.services];
        },
        []
      );
      const allServices = allServicesWithVienna.filter(
        (s) => s.id !== 'vienna-test'
      );
      const servicesPrice = allServices.reduce((acc, service) => {
        return acc + service.price;
      }, 0);
      const serviceCounts = allServices.reduce((acc, service) => {
        if (acc[service.id]) {
          acc[service.id] = acc[service.id] + 1;
        } else {
          acc[service.id] = 1;
        }
        return acc;
      }, {});

      const doverPrices = appointment?.details?.employees?.reduce(
        (acc, employee) => {
          const requiresDover = employee.dover?.required;
          return requiresDover ? acc + DOVER_PRICE : acc;
        },
        0
      );
      const xrayPrices = appointment?.details?.employees?.reduce(
        (acc, employee) => {
          const requiresXray = employee.xray?.required;
          return requiresXray ? acc + XRAYS_PRICE : acc;
        },
        0
      );
      const employeesDoingDOver = appointment?.details?.employees?.filter(
        (employee) => employee.dover?.required
      ).length;

      const employeesDoingXray = appointment?.details?.employees?.filter(
        (employee) => employee.xray?.required
      ).length;

      setDoverPrice(doverPrices);
      setDoverCount(employeesDoingDOver);
      setXrayPrice(xrayPrices);
      setXrayCount(employeesDoingXray);
      setServicesPrice(servicesPrice);
      setServiceCounts(serviceCounts);
      setServices(allServices);
      if (appointment.invoice) {
        setButtonDisabled(true);
      }
    });
    socket.on('DATABASE_UPDATED', (u) => {
      //
      socket.emit('GET_APPOINTMENT', { id: params.appId });
    });
  }

  return (
    <StyedContainer>
      <div class='container'>
        <div class='container'>
          <br />
          <div class='row'>
            <div class='col-1'></div>
            <div class='col-10 text-center'>
              <a
                id='printPageButton'
                className='btn btn-primary mr-1'
                href={'/appointment/' + appointment.id}
              >
                {' '}
                Close
              </a>
              <button
                id='printPageButton'
                className='btn btn-primary ml-1'
                onClick={() => savetopdf()}
              >
                {' '}
                Save as PDF{' '}
              </button>
              <button
                id='printPageButton'
                disabled={disableButton}
                className='btn btn-primary ml-1'
                onClick={() => uploadToCloudinary()}
              >
                {' '}
                {status}{' '}
              </button>
            </div>
          </div>
          <br />
          <div className='row'>
            <div className='col-1'></div>
            <div id='quote-container' className='quote-container'>
              <br />
              <div class='row details-row'>
                <div class='col-md-6'>
                  <img
                    className='logo-abbr'
                    src='/images/cplogo-text.png'
                    alt=''
                  />
                </div>
              </div>
              <hr />
              <div class='row details-row'>
                <div class='col-md-6 text-left'>
                  <h4>
                    <strong>Postal Address</strong>
                  </h4>
                  <p>Postnet P156</p>
                  <p>Private Bag X 7260</p>
                  <p>Practice No 0286389</p>
                  <p>1035</p>
                </div>
                <div class='col-md-6 text-left'>
                  <h4>
                    <strong>Physical Address</strong>
                  </h4>
                  <p>Extension 5</p>
                  <p>Witbank 1035</p>
                  <p>Tel 013 656 2020</p>
                  <p>Fax 013 658 5036</p>
                </div>
              </div>
              <hr />
              <div class='row details-row'>
                <div class='col-md-6 text-left'>
                  <h4>Created On</h4>
                  <p className='mb-3'>
                    <strong>
                      {appointment?.tracking
                        ? moment(
                            appointment?.tracking[0]?.date
                              ? appointment?.tracking[0]?.date
                              : new Date()
                          ).format('DD-MM-YYYY')
                        : ''}
                    </strong>
                  </p>
                  <h4>Booked for</h4>
                  <p className='mb-3'>
                    <strong>{appointment?.details?.date}</strong>
                  </p>
                  <h4>Purchase Order Number</h4>
                  <p className='mb-3'>
                    <strong>{appointment?.details?.purchaseOrderNumber}</strong>
                  </p>
                  <h4>Invoice Number</h4>
                  <p className='mb-3'>
                    <strong>{computeLoading ? 'Loading…' : invoiceNumber || appointment.id}</strong>
                  </p>
                  <h4>Terms</h4>
                  <p>
                    <strong>E&O E. Errors and ommisions expected</strong>
                  </p>
                </div>
                <div class='col-md-6 text-left'>
                  <h4>Bill To </h4>
                  <strong>
                    <strong>{company?.details?.name}</strong>
                  </strong>
                  <p>{company?.details?.physicalAddress}</p>
                  <p>Vat: {company?.details?.vat}</p>
                  <hr />
                  <h4>Appointment ID</h4>
                  <p>
                    <strong>{appointment.id}</strong>
                  </p>
                </div>
              </div>
              <div class='row'>
                <div class='col-md-12 '>
                  <br />
                  <hr />
                  <div>
                    <table class='table'>
                      <thead>
                        <tr>
                          <th>
                            <h5>Description</h5>
                          </th>
                          <th>
                            <h5>Quantity</h5>
                          </th>
                          <th class='text-right'>
                            <h5>Amount</h5>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class='section-header'>
                          <td colspan='3'>
                            <h5>Service prices</h5>
                          </td>
                        </tr>
                        {values(MEDICAL_SERVICES)
                          .map((service) =>
                          serviceCounts[service.id] ? (
                            <tr>
                              <td class='col-md-8'>{service.title}</td>
                              <td
                                class='col-md-1'
                                style={{ textAlign: 'center' }}
                              >
                                {serviceCounts[service.id]}
                              </td>
                              <td class='col-md-5 text-right'>
                                {formatPrice(service.price)}
                              </td>
                            </tr>
                          ) : (
                            ''
                          )
                        )}

                        <tr class='section-header'>
                          <td colspan='3'>
                            <h5>Site Prices</h5>
                          </td>
                        </tr>
                        {appointment?.details?.employees?.map((employee) => (
                          <tr>
                            <td class='col-md-8 text-capitalize'>
                              {employee?.name}
                            </td>
                            <td
                              class='col-md-1'
                              style={{ textAlign: 'center' }}
                            >
                              {employee?.sites && employee?.sites.length > 0
                                ? employee?.sites.length
                                : 0}
                            </td>
                            <td class='col-md-5 text-right'>
                              {formatPrice(0)}
                            </td>
                          </tr>
                        ))}

                        <tr class='section-header'>
                          <td colspan='3'>
                            <h5>Access cards</h5>
                          </td>
                        </tr>
                        <tr>
                          <td class='col-md-8'>Access cards</td>
                          <td class='col-md-1' style={{ textAlign: 'center' }}>—</td>
                          <td class='col-md-5 text-right'>No charge</td>
                        </tr>
                        <tr class='section-header'>
                          <td colspan='3'>
                            <h3>Clinicplus Medicals Total</h3>
                          </td>
                        </tr>
                        <tr>
                          <td class='col-md-8'></td>
                          <td class='col-md-1' style={{ textAlign: 'center' }}>
                            <h4>
                              <strong>Total: </strong>
                            </h4>
                          </td>
                          <td class='col-md-5 text-right'>
                            <h3>
                              <strong>
                                {formatPrice(
                                  computedBreakdown ? computedBreakdown.servicesSubtotal : servicesPrice
                                )}
                              </strong>
                            </h3>
                          </td>
                        </tr>
                        <tr class='section-header'>
                          <td colspan='3'>
                            <h3>Clinicplus Dover Total</h3>
                          </td>
                        </tr>
                        <tr>
                          <td class='col-md-8 text-capitalize'>Employees</td>
                          <td class='col-md-1'>
                            {computedBreakdown ? computedBreakdown.doverEmployeeCount : doverCount}
                          </td>
                          <td class='col-md-5 text-right'>
                            <h3>
                              {formatPrice(computedBreakdown ? computedBreakdown.doverSubtotal : doverPrice)}
                            </h3>
                          </td>
                        </tr>
                        <tr class='section-header'>
                          <td colspan='3'>
                            <h3>Xray Service</h3>
                          </td>
                        </tr>
                        <tr>
                          <td class='col-md-8 text-capitalize'>Employees</td>
                          <td class='col-md-1'>
                            {computedBreakdown ? computedBreakdown.xrayEmployeeCount : xrayCount}
                          </td>
                          <td class='col-md-5 text-right'>
                            <h3>
                              {formatPrice(computedBreakdown ? computedBreakdown.xraySubtotal : xrayPrice)}
                            </h3>
                          </td>
                        </tr>
                        <tr class='grand-total-row'>
                          <td class='col-md-8'></td>
                          <td class='col-md-1' style={{ textAlign: 'center' }}>
                            <h3>
                              <strong>Grand Total:</strong>
                            </h3>
                          </td>
                          <td class='col-md-5 text-right'>
                            <h2>
                              <strong>{formatPrice(grandTotal)}</strong>
                            </h2>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div class='row details-row'>
                <div class='col-md-6 text-left'>
                  <h4>
                    <strong>Banking Details</strong>
                  </h4>
                  <p>ClinicPlus (PTY)LTD</p>
                  <p>Bank: ABSA</p>
                  <p>Account Number: 4069672703</p>
                  <p>Account Type: Cheque</p>
                  <p>Branch: 632005</p>
                  <p>Reference: {company?.details?.name}</p>
                </div>

                <div class='col-md-6 text-left'>
                  <h4>
                    <strong>Dover Service Banking Details</strong>
                  </h4>
                  <p>ClinicPlus Health And Safety Training</p>
                  <p>Bank: FNB</p>
                  <p>Account Number: 62763932243</p>
                  <p>Account Type: Gold Business Account</p>
                  <p>Branch Code: 270250</p>
                  <p>Branch Name: WITBANK 430</p>
                </div>
                <div class='col-md-6 text-left'>
                  <h4>
                    <strong>Xray Service Banking Details</strong>
                  </h4>
                  <p>Maxis</p>
                  <p>Standardbank</p>
                  <p>281086303</p>
                  <p>Universal branch code</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StyedContainer>
  );
}

export default App;
