import { isNil, isEmpty, repeat } from "ramda";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const NoAppointments = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500px;
  width: 100%;

`;

const Companies = ({ socket }) => {
  const [clients, setClients] = useState(null);
  const [originalClients, setOriginalClients] = useState(null);
  const [page, setPage] = useState(0);

  const getPageClients = (p) => {
      socket.emit("GET_NEXT_PAGE_CLIENTS", { page: p, role:"client"});
      socket.on("RECEIVE_NEXT_PAGE_CLIENTS", (data) => {
        setClients(data);
        setOriginalClients(data);
        setPage(p);
      });
  };

  if (socket && !clients) {
    getPageClients(0);
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap mb-2 align-items-center justify-content-between">
        <div className="mb-3 mr-3">
          <h6 className="fs-16 text-black font-w600 mb-0">
            Clients
          </h6>
          <span className="fs-14">All active clients listed here </span>
        </div>
      </div>
      <div className="row">
        <div className="col-xl-12">
          <div className="tab-content">
            <div id="All" className="tab-pane active fade show">
              <div className="table-responsive">
                {!isNil(clients) && !isEmpty(clients) && (
                  <table
                    id="example2"
                    className="table card-table display dataTablesCard"
                  >
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Contact No</th>
                        <th>Companies</th>
                        <th>Appointments</th>
                        <th>Suspended </th>
                        <th> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients?.map((client, index) => (
                        <tr key={index}>
                          <td>{client?.id}</td>
                          <td>{client?.details.name}</td>
                          <td>{client?.details.email}</td>
                          <td>{client?.details.cell}</td>
                          <td>{client?.companiesManaging.length}</td>
                          <td>{client?.appointmentsManaging.length}</td>
                          <td>{client?.isSuspended ?  "Yes" : "No"}</td>
                          <td>
                            <Link to={`/client/edit/${client?.id}`}  className="btn btn-xs btn-primary text-nowrap">                              
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {(isNil(clients) || isEmpty(clients)) && (
                  <NoAppointments>
                    <div className="d-flex">
                      <h1>No Clients</h1>
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
              onClick={() => getPageClients(page === 0 ? 0 : page-1)}
            >
              Prev Page
            </a>
          </li> 
          <li className="nav-item">
            <a
              className={`nav-link`}
              onClick={() => getPageClients(page+1)}
            >
              Next Page
            </a>
          </li>
          {repeat('i', page).map((i, index) => (
            <li className="nav-item">
              <a
                className={`nav-link`}
                onClick={() => getPageClients(index)}
              >
                Page {index+1}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Companies;
