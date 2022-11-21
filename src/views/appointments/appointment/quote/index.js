import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BasicDocument from "./BasicDocument";
import { MEDICAL_SERVICES } from "../../../../config";
import { keys } from "ramda";
import styled from "styled-components";
import html2canvas from "html2canvas";
import jspdf from "jspdf";
import axios from "axios";

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
  background-color: #fff;
  img {
    width: 100%;
  }
  h5 {
    padding: 10px 0;
  }
  td,
  th {
    padding: 5px 0 !important;
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
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState({});
  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [servicesPrice, setServicesPrice] = useState(0);
  const [sitesPrice, setSitesPrice] = useState(0);
  const [company, setCompany] = useState({});
  const [disableButton, setButtonDisabled] = useState(false);
  const [status , setStatus] = useState("Email Invoice");

  const savetopdf = () => {
    window.scrollTo(0, 0);
    const input = document.getElementById("quote-container");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jspdf("p", "mm", "a4");
      var width = pdf.internal.pageSize.getWidth() - 20;
      var height = pdf.internal.pageSize.getHeight() - 20;
      pdf.addImage(imgData, "JPEG", 10, 0, width, height);
      pdf.save("download.pdf");
    });
  };

  const uploadToCloudinary = () => {
    setButtonDisabled(true);
    setStatus("Generating invoice...");
    window.scrollTo(0, 0);
    const input = document.getElementById("quote-container");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jspdf("p", "mm", "a4");
      var width = pdf.internal.pageSize.getWidth() - 20;
      var height = pdf.internal.pageSize.getHeight() - 20;
      pdf.addImage(imgData, "JPEG", 10, 0, width, height);
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
          //console.log(response.data.secure_url);
          socket.emit("SEND_INVOICE", { appointment, url: response.data.secure_url });
          setStatus("Sending...");
          socket.on("RECEIVE_SAVE_INVOICE_SUCCESS", (data) => {
            setStatus("Invoice sent!");
          });
        })
        .catch((errr) => setStatus("Error sending invoice"));
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
      const services = keys(MEDICAL_SERVICES).reduce((accx, service) => {
        const filteredServices = allServices.filter((s) => s.id === service);
        const reducedPriceFromFilteredServices = filteredServices.reduce(
          (acc, service) => {
            return acc + service.price;
          },
          0
        );

        if (filteredServices.length > 0) {
          return [
            ...accx,
            {
              id: service,
              price: reducedPriceFromFilteredServices,
              filter: filteredServices,
            },
          ];
        }
        return accx;
      }, []);

      //console.log(services);
      const servicesPrice = services.reduce((acc, service) => {
        return acc + service.price;
      }, 0);
      const sitesPrices = appointment?.details?.employees?.reduce(
        (acc, employee) => {
          return employee?.sites ? acc + employee?.sites?.length * 35 : acc;
        },
        0
      );
      //console.log(sitesPrices);
      setServicesPrice(servicesPrice);
      setSitesPrice(sitesPrices);
      setServices(services);
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
            <div id="quote-container" className="col-10 quote-container">
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
                    <strong>Clinicplus Pty (LTD)</strong>
                  </h4>
                  <p>Postnet P156</p>
                  <p>Private Bag X 7260</p>
                  <p>Practice No 0286389</p>
                  <p>1035</p>
                </div>
                <div class="col-md-6 text-left">
                  <p>02 Churchill Avenue</p>
                  <p>Extension 5</p>
                  <p>Witbank 1035</p>
                  <p>Tel 013 658 2020</p>
                  <p>Fax 013 658 5036</p>
                </div>
              </div>
              <br />
              <div class="row details-row">
                <div class="col-md-6 text-left">
                  <h4>
                    <strong>{company?.details?.name}</strong>
                  </h4>
                  <p>{company?.details?.postalAddress}</p>
                </div>
                <div class="col-md-6 text-left">
                  <h4> </h4>
                  <p>{company?.details?.physicalAddress}</p>
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
                        {services?.map((service) => (
                          <tr>
                            <td class="col-md-8">
                              {MEDICAL_SERVICES[service.id].title}
                            </td>
                            <td
                              class="col-md-1"
                              style={{ textAlign: "center" }}
                            >
                              {service.filter.length}
                            </td>
                            <td class="col-md-5 text-right">
                              {formatPrice(service.price)}
                            </td>
                          </tr>
                        ))}
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
            </div>
          </div>
        </div>
      </div>
    </StyedContainer>
  );
}

export default App;
