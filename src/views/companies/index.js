import { isNil, isEmpty, repeat } from "ramda";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

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

const Companies = ({ socket }) => {
  const [companies, setCompanies] = useState(null);
  const [originalCompanies, setOriginalCompanies] = useState(null);
  const [page, setPage] = useState(0);

  const getPageCompanies = (p) => {
      socket.emit("GET_NEXT_PAGE_COMPANIES", { page: p});
      socket.on("RECEIVE_NEXT_PAGE_COMPANIES", (data) => {
        setCompanies(data);
        setOriginalCompanies(data);
        setPage(p);
      });
  };

  if (socket && !companies) {
    getPageCompanies(0);
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap mb-2 align-items-center justify-content-between">
        <div className="mb-3 mr-3">
          <h6 className="fs-16 text-black font-w600 mb-0">
            Companies
          </h6>
          <span className="fs-14">All active companies listed here </span>
        </div>
      </div>
      <div className="row">
        <div className="col-xl-12">
          <div className="tab-content">
            <div id="All" className="tab-pane active fade show">
              <div className="table-responsive">
                {!isNil(companies) && !isEmpty(companies) && (
                  <table
                    id="example2"
                    className="table card-table display dataTablesCard"
                  >
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Manager</th>
                        <th>Vat</th>
                        <th>Registration Number </th>
                        <th>Info </th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies?.map((company, index) => (
                        <tr key={index}>
                          <td>{company.id}</td>
                          <td>{company.details.name}</td>
                          <td>{company.usersWhoCanManage[0].name}</td>
                          <td>{company.details.vat}</td>
                          <td>{company.details.registrationNumber}</td>
                          <td>
                            <Link to={`/company/edit/${company.id}`}  className="btn btn-xs btn-primary text-nowrap">
                              <i
                                className="fa fa-info
                                            scale5 mr-3"
                                aria-hidden="true"
                              ></i>
                              More info
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {(isNil(companies) || isEmpty(companies)) && (
                  <NoAppointments>
                    <div className="d-flex">
                      <h1>No Companies</h1>
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
              onClick={() => getPageCompanies(page === 0 ? 0 : page-1)}
            >
              Prev Page
            </a>
          </li> 
          <li className="nav-item">
            <a
              className={`nav-link`}
              onClick={() => getPageCompanies(page+1)}
            >
              Next Page
            </a>
          </li>
          {repeat('i', page).map((i, index) => (
            <li className="nav-item">
              <a
                className={`nav-link`}
                onClick={() => getPageCompanies(index)}
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
