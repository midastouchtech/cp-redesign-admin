import moment from "moment";
import { isNil, isEmpty, repeat, take } from "ramda";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";


const formatPrice = (price) => {
  return `R ${price.toFixed(2)}`;
};

const getBadgeclassName = (status) => {
  switch (status) {
    case "pending":
      return "badge badge-warning";
    case "approved":
      return "badge badge-success";
    case "declined":
      return "badge badge-danger";
    default:
      return "badge badge-primary";
  }
};

const NoAppointments = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500px;
  width: 100%;
`;

const Invoices = ({ socket }) => {
  const [invoices, setInvoices] = useState(null);
  const [page, setPage] = useState(0);

  const getAllInvoices = () => {
    socket.emit("GET_ALL_INVOICES");
    socket.on("RECEIVE_ALL_INVOICES", (data) => {
      setInvoices(data);
    });
  };

  if (socket && !invoices) {
    getAllInvoices();
  }

  const getPageInvoices = (p) => {
    socket.emit("GET_NEXT_PAGE_INVOICES", { page: p });
    socket.on("RECEIVE_NEXT_PAGE_INVOICES", (data) => {
      setInvoices(data);
      setPage(p);
    });
  };

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap mb-2 align-items-center justify-content-between">
        <div className="mb-3 mr-3">
          <h6 className="fs-16 text-black font-w600 mb-0">
            Invoices
          </h6>
          <span className="fs-14"> All invoices sent listed here </span>
        </div>
      </div>
      <div className="row">
        <div className="col-xl-12">
          <div className="tab-content">
            <div id="All" className="tab-pane active fade show">
              <div className="table-responsive">
                {!isNil(invoices) && !isEmpty(invoices) && (
                  <table
                    id="example2"
                    className="table card-table display dataTablesCard"
                  >
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Company</th>
                        <th>Client</th>
                        <th>Emailed to</th>
                        <th>Amount </th>
                        <th>Date Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices?.map((invoice, index) => (
                        <tr key={index}>
                          <td>{take(8,invoice.id)}</td>
                          <td>{invoice?.company?.name}</td>
                          <td>{invoice?.client?.name} {invoice?.client?.surname}</td>
                          <td>{invoice.client?.email}</td>
                          <td>{formatPrice(invoice?.payment?.amount)}</td>
                          <td>{moment(invoice?.date).format("DD MMM YYYY HH:mm")}</td>
                          <td><a href={invoice?.url} target="_blank" className="btn btn-primary">View</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {(isNil(invoices) || isEmpty(invoices)) && (
                  <NoAppointments>
                    <div className="d-flex">
                      <h1>No Invoices</h1>
                    </div>
                  </NoAppointments>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="event-tabs mb-3 mr-3">
        <ul className="nav nav-tabs" role="tablist">
          <li className="nav-item">
            <a
              className={`nav-link`}
              onClick={() => getPageInvoices(page === 0 ? 0 : page - 1)}
            >
              Prev Page
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link`}
              onClick={() => getPageInvoices(page + 1)}
            >
              Next Page
            </a>
          </li>
          {repeat("i", page).map((i, index) => (
            <li className="nav-item">
              <a
                className={`nav-link`}
                onClick={() => getPageInvoices(index)}
              >
                Page {index + 1}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Invoices;
