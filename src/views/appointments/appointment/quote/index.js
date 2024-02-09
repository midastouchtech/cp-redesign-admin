import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DOVER_PRICE, MEDICAL_SERVICES } from '../../../../config';
import { keys, values } from 'ramda';
import styled from 'styled-components';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import moment from 'moment';

const formatPrice = (price) => {
  return `R ${price.toFixed(2)}`;
};

const StyedContainer = styled.div`
  @media print {
    #printPageButton {
      display: none;
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
  tr {
    &:last-of-type {
      td {
        border: none;
      }
    }
  }
`;

function App({ socket }) {
  let params = useParams();
  const invoiceId = uuid();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState({});
  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [servicesPrice, setServicesPrice] = useState(0);
  const [totalAccessCardPrice, setAccessCardPrice] = useState(0);
  const [sitesPrice, setSitesPrice] = useState(0);
  const [company, setCompany] = useState({});
  const [disableButton, setButtonDisabled] = useState(false);
  const [status, setStatus] = useState('Email Invoice');
  const [serviceCounts, setServiceCounts] = useState({});
  const [doverCount, setDoverCount] = useState(0);
  const [doverPrice, setDoverPrice] = useState(0);

  const savetopdf = () => {
    window.scrollTo(0, 0);
    const input = document.getElementById('quote-container');
    var doc = new jspdf('p', 'px', 'a4');
    doc.html(input, {
      callback: function (pdf) {
        //
        pdf.save('mypdf.pdf');
      },
      html2canvas: {
        scale: 0.36,
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
    var doc = new jspdf('p', 'px', 'a4');
    doc.html(input, {
      callback: function (pdf) {
        var blob = pdf.output('blob');
        const url = `${process.env.REACT_APP_IO_SERVER}upload-file-to-cloud-storage`;
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
            socket.emit('SEND_INVOICE', {
              appointment,
              url: response.data.publicUrl,
              invoiceId,
            });
            setStatus('Sending...');
            socket.on('RECEIVE_SAVE_INVOICE_SUCCESS', (data) => {
              setStatus('Invoice sent!');
            });
          })
          .catch((errr) => setStatus('Error sending invoice'));
      },
      html2canvas: {
        scale: 0.36,
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
      //
      console.log('all services', allServices);
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

      const sitesPrices = appointment?.details?.employees?.reduce(
        (acc, employee) => {
          return employee?.sites.length >= 2
            ? acc + 38.4
            : acc;
        },
        0
      );
      console.log('sitesPrices', sitesPrices);
      const accessCardPrices = appointment?.details?.employees?.reduce(
        (acc, employee) => {
          const accessCardSites = employee.sites.filter(
            (s) => s.hasAccessCard === true
          );
          return accessCardSites.length > 0
            ? acc + (accessCardSites.length - 1) * 51.2
            : acc;
        },
        0
      );
      const doverPrices = appointment?.details?.employees?.reduce(
        (acc, employee) => {
          const requiresDover = employee.dover?.required;
          return requiresDover ? acc + DOVER_PRICE : acc;
        },
        0
      );
      const employeesDoingDOver = appointment?.details?.employees?.filter(
        (employee) => employee.dover?.required
      ).length;

      console.log('doverPrice', doverPrices);
      console.log('servicesPrice', servicesPrice);
      console.log('site price', sitesPrice);
      console.log('accessCardPrice', accessCardPrices);
      const bookingPrice =
        servicesPrice + sitesPrice + accessCardPrices + doverPrices;
      console.log('bookingPrice', bookingPrice);

      setDoverPrice(doverPrices);
      setDoverCount(employeesDoingDOver);
      setServicesPrice(servicesPrice);
      setServiceCounts(serviceCounts);
      console.log("setting sites price", sitesPrices)
      setSitesPrice(sitesPrices);
      setAccessCardPrice(accessCardPrices);
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
                    <strong>{appointment.id}</strong>
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
                        <h5>Service prices</h5>
                        {values(MEDICAL_SERVICES).map((service) =>
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

                        <br />
                        <h5>Site Prices</h5>
                        {appointment?.details?.employees?.map((employee) => (
                          <tr>
                            <td class='col-md-8 text-capitalize'>
                              {employee?.name}
                            </td>
                            <td
                              class='col-md-1'
                              style={{ textAlign: 'center' }}
                            >
                              {employee?.sites && employee?.sites.length >= 2
                                ? 38.40
                                : 0}
                            </td>
                            <td class='col-md-5 text-right'>
                              {formatPrice(
                                employee?.sites?.length > 0
                                  ? 38.4
                                  : 0
                              )}
                            </td>
                          </tr>
                        ))}

                        <br />
                        <h5>Access Card Prices</h5>
                        {appointment?.details?.employees?.map((employee) => {
                          const accessCardSites = employee.sites.filter(
                            (s) => s.hasAccessCard === true
                          );
                          return (
                            <tr>
                              <td class='col-md-8 text-capitalize'>
                                {employee?.name}
                              </td>
                              <td
                                class='col-md-1'
                                style={{ textAlign: 'center' }}
                              >
                                {accessCardSites.length}
                              </td>
                              <td class='col-md-5 text-right'>
                                {formatPrice(
                                  accessCardSites.length > 0
                                    ? (accessCardSites.length - 1) * 51.2
                                    : 0
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        <br />
                        <tr>
                          <td class='col-md-8'></td>
                          <td class='col-md-1' style={{ textAlign: 'center' }}>
                            <h4>
                              <strong>Total: </strong>
                            </h4>
                          </td>
                          <td class='col-md-5 text-right'>
                            <h4>
                              <strong>
                                {formatPrice(
                                  servicesPrice +
                                    sitesPrice +
                                    totalAccessCardPrice
                                )}
                              </strong>
                            </h4>
                          </td>
                        </tr>
                        <br />
                        <br />
                        <h5>Dover Service</h5>
                        <tr>
                          <td class='col-md-8 text-capitalize'>Employees</td>
                          <td class='col-md-1'>{doverCount}</td>
                          <td class='col-md-5 text-right'>
                            {formatPrice(doverPrice)}
                          </td>
                        </tr>
                        <br />
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
                    <strong>Xray Service Banking Details</strong>
                  </h4>
                  <p>Maxis</p>
                  <p>Standardbank</p>
                  <p>281086303</p>
                  <p>Universal branch code</p>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </StyedContainer>
  );
}

export default App;
