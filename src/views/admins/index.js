import { isNil, isEmpty, repeat } from "ramda";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const NoAppointments = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500px;
  width: 100%;

`;

const Admins = ({ socket }) => {
  const [admins, setAdmins] = useState(null);
  const [originalAdmins, setoriginalAdmins] = useState(null);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setNotFound(false);
    socket.emit("SEARCH_ADMIN", { term: searchTerm });
    socket.on("RECEIVE_SEARCHED_ADMIN", (data) => {
      setAdmins(data);
      setLoading(false);
    });
    socket.on("RECEIVE_SEARCHED_ADMIN_NOT_FOUND", (data) => {
      setAdmins(originalAdmins);
      setNotFound(true);
      setLoading(false);
    });
  };

  const clearSearch = () => {
    setAdmins(originalAdmins);
    setSearchTerm("");
    setNotFound(false);
  }

  const getPageAdmins = (p) => {
      socket.emit("GET_NEXT_PAGE_CLIENTS", { page: p, role:"admin" });
      socket.on("RECEIVE_NEXT_PAGE_CLIENTS", (data) => {
        setAdmins(data);
        setoriginalAdmins(data);
        setPage(p);
      });
  };

  useEffect(()=>{
    console.log("use effect socket", socket)
    if (socket && !admins) {
      getPageAdmins(0);
    }
  }, [socket]);
  

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap mb-2 align-items-center justify-content-between">
        <div className="mb-3 mr-3">
          <h6 className="fs-16 text-black font-w600 mb-0">
            Admins
          </h6>
          <span className="fs-14">All active administrators listed here </span>
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
          <button type="button" class="btn btn-primary" onClick={handleSearch}>Search</button>
        </div>
        <div className="col-1">
          <button type="button" class="btn btn-primary" onClick={clearSearch}>Clear</button>
        </div>
      </div>
      <div className="row">
        <div className="col-12 d-flex justify-content-center">
        {loading && (
          <div className="spinner-border" role="status">
            <span className="sr-only">Searching for administrator</span>
          </div>
        )}
        </div>
        {notFound && (
          <div className="alert alert-danger" role="alert">
            Admin could not be found.
          </div>
        )}
      </div>
      <br />
      <div className="row">
        <div className="col-xl-12">
          <div className="tab-content">
            <div id="All" className="tab-pane active fade show">
              <div className="table-responsive">
                {!isNil(admins) && !isEmpty(admins) && (
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
                        <th>Admin Type</th>
                        <th> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins?.map((admin, index) => (
                        <tr key={index}>
                          <td>{admin?.id}</td>
                          <td>{admin?.details.name}</td>
                          <td>{admin?.details.email}</td>
                          <td>{admin?.details.cell}</td>
                          <td>{admin?.details.adminType === "xrayAdmin" ?  "X-ray Admin" : "Regular Admin"}</td>
                          <td>
                            <Link to={`/admin/edit/${admin?.id}`}  className="btn btn-xs btn-primary text-nowrap">                              
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {(isNil(admins) || isEmpty(admins)) && (
                  <NoAppointments>
                    <div className="d-flex">
                      <h1>No Admins</h1>
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
              onClick={() => getPageAdmins(page === 0 ? 0 : page-1)}
            >
              Prev Page
            </a>
          </li> 
          <li className="nav-item">
            <a
              className={`nav-link`}
              onClick={() => getPageAdmins(page+1)}
            >
              Next Page
            </a>
          </li>
          {repeat('i', page).map((i, index) => (
            <li className="nav-item">
              <a
                className={`nav-link`}
                onClick={() => getPageAdmins(index)}
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

export default Admins;
