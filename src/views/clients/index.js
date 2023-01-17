import { isNil, isEmpty, repeat, assoc } from "ramda";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { confirmAlert } from "react-confirm-alert"; // Import
import "react-confirm-alert/src/react-confirm-alert.css"; // Import css

const getMessage = (client) => (
  <p>
    Are you sure you want to delete
    <br />
    <strong>
      {client.details.name} {client.details.surname}
    </strong>
    &nbsp; and all their data?
    <br />
    This user has {client.appointmentsManaging.length} appointments and{" "}
    {client.companiesManaging.length} companies registered on the system.
  </p>
);

const NoAppointments = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500px;
  width: 100%;
`;

const Companies = ({ socket }) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState(null);
  const [originalClients, setOriginalClients] = useState(null);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const getPageClients = (p) => {
    socket.emit("GET_NEXT_PAGE_CLIENTS", { page: p, role: "client" });
    socket.on("RECEIVE_NEXT_PAGE_CLIENTS", (data) => {
      setClients(data);
      setOriginalClients(data);
      setPage(p);
    });
  };

  if (socket && !clients) {
    getPageClients(0);
  }

  const handleSearch = async () => {
    setLoading(true);
    setNotFound(false);
    socket.emit("SEARCH_USER", { term: searchTerm });
    socket.on("RECEIVE_SEARCHED_USER", (data) => {
      setClients(data);
      setLoading(false);
    });
    socket.on("RECEIVE_SEARCHED_USER_NOT_FOUND", (data) => {
      setClients([]);
      setNotFound(true);
      setLoading(false);
    });
  };

  const deleteUser = (user) => {
    setDeleteLoading(true);
    socket.emit("DELETE_USER", user);
    socket.on("USER_DELETE_SUCCESS", () => {
      setDeleteLoading(false);
      const newClients = clients.map((c) => {
        if (c._id === user._id) {
          return assoc("isDeleted", true, c);
        }
        return c;
      });
      const newOriginalClients = originalClients.map((c) => {
        if (c._id === user._id) {
          return assoc("isDeleted", true, c);
        }
        return c;
      });
      setClients(newClients);
      setOriginalClients(newOriginalClients);
    });
  };

  const clearSearch = () => {
    setClients(originalClients);
    setSearchTerm("");
    setNotFound(false);
  };

  const deleteOptions = (client) => ({
    title: "Delete",
    message: getMessage(client),
    buttons: [
      {
        label: "Yes",
        onClick: () => deleteUser(client),
      },
      {
        label: "No",
        onClick: () => {},
      },
    ],
    closeOnEscape: true,
    closeOnClickOutside: true,
    keyCodeForClose: [8, 32],
    willUnmount: () => {},
    afterClose: () => {},
    onClickOutside: () => {},
    onKeypress: () => {},
    onKeypressEscape: () => {},
    overlayClassName: "overlay-custom-class-name",
  });

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap mb-2 align-items-center justify-content-between">
        <div className="mb-3 mr-3">
          <h6 className="fs-16 text-black font-w600 mb-0">Clients</h6>
          <span className="fs-14">All active clients listed here </span>
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-10">
          <input
            type="text"
            className="form-control input-default"
            placeholder="Enter user name"
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
          />
        </div>
        <div className="col-1">
          <button type="button" class="btn btn-primary" onClick={handleSearch}>
            Search
          </button>
        </div>
        <div className="col-1">
          <button type="button" class="btn btn-primary" onClick={clearSearch}>
            Clear
          </button>
        </div>
      </div>
      <div className="row">
        <div className="col-12 d-flex justify-content-center">
          {loading && (
            <div className="spinner-border" role="status">
              <span className="sr-only">Searching for appointment</span>
            </div>
          )}
          {deleteLoading && (
            <div className="col-12 text-center" >
              <i>Deleting user data...</i>
            </div>
          )}
        </div>
        {notFound && (
          <div className="alert alert-danger" role="alert">
            Client could not be found.
          </div>
        )}
      </div>
      <br />
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
                        <tr
                          key={index}
                          className={`${client.isDeleted ? "table-dark" : ""}`}
                        >
                          <td>{client?.id}</td>
                          <td>{client?.details.name}</td>
                          <td>{client?.details.email}</td>
                          <td>{client?.details.cell}</td>
                          <td>{client?.companiesManaging?.length}</td>
                          <td>{client?.appointmentsManaging?.length}</td>
                          <td>{client?.isSuspended ? "Yes" : "No"}</td>
                          <td>
                            {client.isDeleted && <i>Deleted</i>}
                            {!client.isDeleted && (
                              <Link
                                to={`/client/edit/${client?.id}`}
                                className="btn btn-xs btn-primary text-nowrap"
                              >
                                Edit
                              </Link>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() =>
                                confirmAlert(deleteOptions(client))
                              }
                              className="btn btn-xs btn-primary text-nowrap"
                              disabled={client.isDeleted === true}
                            >
                              Delete
                            </button>
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
              onClick={() => getPageClients(page === 0 ? 0 : page - 1)}
            >
              Prev Page
            </a>
          </li>
          <li className="nav-item">
            <a className={`nav-link`} onClick={() => getPageClients(page + 1)}>
              Next Page
            </a>
          </li>
          {repeat("i", page).map((i, index) => (
            <li className="nav-item">
              <a className={`nav-link`} onClick={() => getPageClients(index)}>
                Page {index + 1}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Companies;
