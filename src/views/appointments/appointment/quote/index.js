import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BasicDocument from "./BasicDocument";
import { MEDICAL_SERVICES } from "../../../../config";
import { keys, values } from "ramda";
import styled from "styled-components";
import html2canvas from "html2canvas";
import jspdf from "jspdf";
import axios from "axios";
import { v4 as uuid } from 'uuid';

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
  const [sitesPrice, setSitesPrice] = useState(0);
  const [company, setCompany] = useState({});
  const [disableButton, setButtonDisabled] = useState(false);
  const [status, setStatus] = useState("Email Invoice");
  const [serviceCounts , setServiceCounts] = useState({});

  const savetopdf = () => {
    window.scrollTo(0, 0);
    const input = document.getElementById("quote-container");
    var doc = new jspdf("p", "px", "a4");
    doc.html(input, {
      callback: function (pdf) {
        // console.log(pdf)
        pdf.save("mypdf.pdf");
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
    setStatus("Generating invoice...");
    window.scrollTo(0, 0);
    window.scrollTo(0, 0);
    const input = document.getElementById("quote-container");
    var doc = new jspdf("p", "px", "a4");
    doc.html(input, {
      callback: function (pdf) {
        var blob = pdf.output("blob");
        const url = "https://api.cloudinary.com/v1_1/clinic-plus/raw/upload";
        const formData = new FormData();
        formData.append("file", blob, "quote.pdf");
        formData.append("upload_preset", "pwdsm6sz");
        setStatus("Uploading invoice...");
        axios({
          method: "POST",
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
          url,
        })
          .then((response) => {
            console.log(response.data.secure_url);
            socket.emit("SEND_INVOICE", {
              appointment,
              url: response.data.secure_url,
              invoiceId
            });
            setStatus("Sending...");
            socket.on("RECEIVE_SAVE_INVOICE_SUCCESS", (data) => {
              setStatus("Invoice sent!");
            });
          })
          .catch((errr) => setStatus("Error sending invoice"));
      },
      html2canvas: {
        scale: 0.36,
      },
      x: 20,
      y: 20,
    });
  };

  if (socket && isLoading) {
    socket.emit("GET_APPOINTMENT", { id: params.appId });
    socket.on("RECEIVE_COMPANY", (data) => {
      setCompany(data);
    });
    socket.on("RECEIVE_APPOINTMENT", (appointment) => {
      socket.emit("GET_COMPANY", { id: appointment?.details?.company?.id });
      setIsLoading(false);
      setAppointment(appointment);
      const allServices = appointment?.details?.employees?.reduce(
        (acc, employee) => {
          return [...acc, ...employee.services];
        },
        []
      );
      console.log(allServices);
      

      //console.log(services);
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
          return employee?.sites ? acc + employee?.sites?.length * 35 : acc;
        },
        0
      );
      console.log(serviceCounts);
      setServicesPrice(servicesPrice);
      setServiceCounts(serviceCounts);
      setSitesPrice(sitesPrices);
      setServices(allServices);
      if (appointment.invoice) {
        setButtonDisabled(true);
      }
    });
    socket.on("DATABASE_UPDATED", (u) => {
      //console.log("Database updated FROM APPOINTMENT PAGE");
      socket.emit("GET_APPOINTMENT", { id: params.appId });
    });
  }

  return (
    <StyedContainer>
      <div class="container">
        <div class="container">
          <br />
          <div class="row">
            <div class="col-1"></div>
            <div class="col-10 text-center">
              <a
                id="printPageButton"
                className="btn btn-primary mr-1"
                href={"/appointment/" + appointment.id}
              >
                {" "}
                Close
              </a>
              <button
                id="printPageButton"
                className="btn btn-primary ml-1"
                onClick={() => savetopdf()}
              >
                {" "}
                Save as PDF{" "}
              </button>
              <button
                id="printPageButton"
                disabled={disableButton}
                className="btn btn-primary ml-1"
                onClick={() => uploadToCloudinary()}
              >
                {" "}
                {status}{" "}
              </button>
            </div>
          </div>
          <br />
          <div className="row">
            <div className="col-1"></div>
            <div id="quote-container" className="quote-container">
              <br />
              <div class="row details-row">
                <div class="col-md-6">
                  <img
                    className="logo-abbr"
                    src="/images/cplogo-text.png"
                    alt=""
                  />
                </div>
              </div>
              <hr />
              <div class="row details-row">
                <div class="col-md-6 text-left">
                  <h4>
                    <strong>Postal Address</strong>
                  </h4>
                  <p>Postnet P156</p>
                  <p>Private Bag X 7260</p>
                  <p>Practice No 0286389</p>
                  <p>1035</p>
                </div>
                <div class="col-md-6 text-left">
                  <h4>
                    <strong>Physical Address</strong>
                  </h4>
                  <p>Extension 5</p>
                  <p>Witbank 1035</p>
                  <p>Tel 013 658 2020</p>
                  <p>Fax 013 658 5036</p>
                </div>
              </div>
              <hr />
              <div class="row details-row">
                <div class="col-md-6 text-left">
                  <h4>Purchase Order Number</h4>
                  <p className="mb-3"><strong >{appointment?.details?.purchaseOrderNumber}</strong></p>
                  <h4>Invoice Number</h4>
                  <p className="mb-3"><strong >{appointment.invoice? appointment.invoice.id : invoiceId}</strong></p>
                  <h4>Terms</h4>
                  <p><strong>E&O E. Errors and ommisions expected</strong></p>
                </div>
                <div class="col-md-6 text-left">
                  <h4>Bill To </h4>
                  <strong>
                    <strong>{company?.details?.name}</strong>
                  </strong>
                  <p>{company?.details?.physicalAddress}</p>
                  <hr />
                  <h4>Appointment ID</h4> 
                  <p><strong>{appointment.id}</strong></p>
                </div>
              </div>
              <div class="row">
                <div class="col-md-12 ">
                  <br />
                  <hr />
                  <div>
                    <table class="table">
                      <thead>
                        <tr>
                          <th>
                            <h5>Description</h5>
                          </th>
                          <th>
                            <h5>Quantity</h5>
                          </th>
                          <th class="text-right">
                            <h5>Amount</h5>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <h5>Service prices</h5>
                        {values(MEDICAL_SERVICES).map((service) => serviceCounts[service.id] ? (
                          <tr>
                            <td class="col-md-8">
                              {service.title}
                            </td>
                            <td
                              class="col-md-1"
                              style={{ textAlign: "center" }}
                            >
                              {serviceCounts[service.id]}
                            </td>
                            <td class="col-md-5 text-right">
                              {formatPrice(service.price)}
                            </td>
                          </tr>
                        ): "")}
                        <br />
                        <h5>Site Prices</h5>
                        {appointment?.details?.employees?.map((employee) => (
                          <tr>
                            <td class="col-md-8">{employee?.name}</td>
                            <td
                              class="col-md-1"
                              style={{ textAlign: "center" }}
                            >
                              {employee?.sites ? employee?.sites?.length : 0}
                            </td>
                            <td class="col-md-5 text-right">
                              {formatPrice(
                                employee?.sites
                                  ? employee?.sites?.length * 35
                                  : 0
                              )}
                            </td>
                          </tr>
                        ))}
                        <br />
                        <tr>
                          <td class="col-md-8"></td>
                          <td class="col-md-1" style={{ textAlign: "center" }}>
                            <h4>
                              <strong>Total: </strong>
                            </h4>
                          </td>
                          <td class="col-md-5 text-right">
                            <h4>
                              <strong>
                                {formatPrice(servicesPrice + sitesPrice)}
                              </strong>
                            </h4>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div class="row details-row">
              <div class="col-md-6 text-left">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </StyedContainer>
  );
}

export default App;
