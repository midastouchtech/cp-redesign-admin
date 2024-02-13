import { isNil, isEmpty, repeat, insert } from "ramda";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { CSVLink, CSVDownload } from "react-csv";
import moment from "moment";
/* eslint-disable */

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

const StyledUL = styled.ul`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  overflow-x: scroll;
  align-items: center;
  width: auto;
  height: 80px;
  li {
    flex-shrink: 0;
    a {
      padding: 0.325rem 0.7rem !important;
    }
  }
`;

const Appointments = ({ socket }) => {
  const [appointments, setAppointments] = useState(null);
  const [originalAppointments, setOriginalAppointments] = useState(null);
  const [monthType, setMonthType] = useState("any");
  const [type, setStatusType] = useState("all");
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [pageLimit, setPageLimit] = useState("25");
  const [hasRequested, setHasRequested] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [appCount, setAppCount] = useState(0);

  const handleSearch = async () => {
    setLoading(true);
    setNotFound(false);
    socket.emit("SEARCH_APPOINTMENT", { term: searchTerm });
    socket.on("RECEIVE_SEARCHED_APPOINTMENT", (data) => {
      setAppointments(data);
      setLoading(false);
    });
    socket.on("RECEIVE_SEARCHED_APPOINTMENT_NOT_FOUND", (data) => {
      setAppointments(originalAppointments);
      setNotFound(true);
      setLoading(false);
    });
  };

  const clearSearch = () => {
    setAppointments(originalAppointments);
    setSearchTerm("");
    setNotFound(false);
  };

  const handleFilter = () => {
    socket.emit("GET_APPOINTMENTS_BY_DATE", { date: fromDate });
    socket.on("RECEIVE_APPOINTMENTS_BY_DATE", (newAppointments) => {
      setAppointments(newAppointments);
    });
  };
  console.log(appointments);
  const csvData =
    !isNil(appointments) && !isEmpty(appointments)
      ? insert(
          0,
          [
            "appointmentId",
            "userName",
            "purchaseOrderNumber",
            "companyName",
            "location",
            "appointmentDate",
            "status",
          ],
          appointments?.map((appointment) => [
            appointment?.id,
            appointment?.usersWhoCanManage[0]?.name,
            appointment?.details?.purchaseOrderNumber,
            appointment?.details?.company?.name,
            appointment?.details?.clinic,
            appointment?.details?.date,
            appointment?.status,
          ])
        )
      : [];

  const getAllAppointments = () => {
    socket.emit("GET_ALL_APPOINTMENTS", { pageLimit });
    socket.on("RECEIVE_ALL_APPOINTMENTS", (data) => {
      const { apps, pages, count } = data;
      setAppointments(apps);
      setPageCount(Math.round(count / pageLimit));
      setAppCount(count);
      setOriginalAppointments(apps);
    });
  };

  useEffect(() => {
    console.log("use effect socket", socket);
    if (socket && !appointments && hasRequested === false) {
      setHasRequested(true);
      getAllAppointments();
    }
  }, [socket]);

  const setAppointmentsType = (type) => {
    if (type === "all") {
      setAppointments(originalAppointments);
    } else {
      const newAppointments = originalAppointments.filter(
        (appointment) => appointment.status === type
      );
      setAppointments(newAppointments);
      setStatusType(type);
    }
  };

  const getCurrentMonthsAppointments = (page) => {
    socket.emit("GET_CURRENT_MONTHS_APPOINTMENTS", {
      page,
      pageLimit,
    });
    socket.on("RECEIVE_CURRENT_MONTHS_APPOINTMENTS", (data) => {
      const { apps, pages, count } = data;
      setAppointments(apps);
      setPageCount(Math.round(count / pageLimit));
      setAppCount(count);
      setOriginalAppointments(apps);
      setMonthType("current");
      setPage(page);
    });
  };

  const getNextMonthsAppointments = (p) => {
    socket.emit("GET_NEXT_MONTHS_APPOINTMENTS", { page: p, pageLimit });
    socket.on("RECEIVE_NEXT_MONTHS_APPOINTMENTS", (data) => {
      const { apps, pages, count } = data;
      setAppointments(apps);
      setPageCount(Math.round(count / pageLimit));
      setAppCount(count);
      setOriginalAppointments(apps);
      setMonthType("next");
      setPage(p);
    });
  };

  const getPrevMonthsAppointments = (p) => {
    socket.emit("GET_PREVIOUS_MONTHS_APPOINTMENTS", { page: p, pageLimit });
    socket.on("RECEIVE_PREVIOUS_MONTHS_APPOINTMENTS", (data) => {
      const { apps, pages, count } = data;
      setAppointments(apps);
      setPageCount(Math.round(count / pageLimit));
      setAppCount(count);
      setOriginalAppointments(apps);
      setMonthType("prev");
      setPage(p);
    });
  };

  const functionsByMonth = {
    any: getAllAppointments,
    current: getCurrentMonthsAppointments,
    next: getNextMonthsAppointments,
    prev: getPrevMonthsAppointments,
  };

  const getAppointmentsByMonth = (e) => {
    console.log("getting first set appointments for monthtype", e.target.value);
    const month = e.target.value;
    if (monthType !== month) {
      functionsByMonth[month](0);
      setMonthType(month);
    }
  };

  const getPageAppointments = (p) => {
    if (monthType === "any") {
      socket.emit("GET_NEXT_PAGE_APPOINTMENTS", { page: p, pageLimit });
      socket.on("RECEIVE_NEXT_PAGE_APPOINTMENTS", (data) => {
        const { apps, pages, count } = data;
        setAppointments(apps);
        setPageCount(Math.round(count / pageLimit));
        setAppCount(count);
        setOriginalAppointments(data);
        setPage(p);
      });
    } else {
      //console.log("getting next page appointments for", monthType, "month");
      functionsByMonth[monthType](p);
    }
  };

  //console.log("prevMonthPageCount", prevMonthPageCount)
  //console.log("currentMonthPageCount", currentMonthPageCount)
  //console.log("nextMonthPageCount", nextMonthPageCount)
  console.log("LOading", loading);
  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap mb-2 align-items-center justify-content-between">
        <div className="mb-3 mr-3">
          <h6 className="fs-16 text-black font-w600 mb-0">Appointments</h6>
          <span className="fs-14">Querying from {appCount} appointments. </span>
          <div className="row"></div>
        </div>

        <div className="d-flex mb-3">
          <select
            className="form-control style-2 default-select mr-3"
            onClick={getAppointmentsByMonth}
          >
            <option value="any" selected={monthType === "any"}>
              All
            </option>
            <option value="current" selected={monthType === "current"}>
              Current month
            </option>
            <option value="next" selected={monthType === "next"}>
              Next month
            </option>
            <option value="prev" selected={monthType === "prev"}>
              Prev Month
            </option>
          </select>
          <CSVLink
            data={csvData}
            filename={"report.csv"}
            className="btn btn-primary text-nowrap"
          >
            {" "}
            Generate Report
          </CSVLink>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6 col-sm-12">
          <h4>Table</h4>
          <p>Filter table to by status</p>
          <div className="mb-3">
            <ul className="row" role="tablist">
              <li className="  col-md-3 col-sm-12">
                <a
                  className={`btn btn-outline-primary ${
                    type === "all" ? "btn-primary" : ""
                  }`}
                  onClick={() => setAppointmentsType("all")}
                >
                  Any Status
                </a>
              </li>
              <li className="  col-md-3 col-sm-12">
                <a
                  className={`btn btn-outline-primary ${
                    type === "approved" ? "btn-primary" : ""
                  }`}
                  onClick={() => setAppointmentsType("approved")}
                >
                  Approved
                </a>
              </li>
              <li className=" col-md-3 col-sm-12">
                <a
                  className={`btn btn-outline-primary ${
                    type === "pending" ? "btn-primary" : ""
                  }`}
                  onClick={() => setAppointmentsType("pending")}
                >
                  Pending
                </a>
              </li>
              <li className="col-md-3 col-sm-12">
                <a
                  className={`btn btn-outline-primary ${
                    type === "declined" ? "btn-primary" : ""
                  }`}
                  onClick={() => setAppointmentsType("declined")}
                >
                  Declined
                </a>
              </li>
            </ul>
          </div>
          <p>Select table page size </p>
          <div className="d-flex mb-3">
            <select
              className="form-control style-2 default-select mr-3"
              onClick={(e) => {
                setPageLimit(e.target.value);
                getAllAppointments();
              }}
            >
              <option value="25" selected={pageLimit === "25"}>
                25
              </option>
              <option value="50" selected={pageLimit === "50"}>
                50
              </option>
              <option value="100" selected={pageLimit === "100"}>
                100
              </option>
            </select>
          </div>
        </div>

        <div className="col-md-6 col-sm-12">
          <h4>Database</h4>
          <p>Search for an appointment </p>
          <div className="row">
            <div className="col-md-6 col-sm-12">
              <input
                type="text"
                className="form-control input-default mb-2"
                placeholder="Enter company name, user name or appointment id"
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
              />
            </div>
            <div className="col-md-4 col-sm-12">
              <button
                type="button"
                class="btn btn-primary btn-block mb-2"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
            <div className="col-md-2 col-sm-12">
              <button
                type="button"
                class="btn btn-primary btn-block mb-3"
                onClick={clearSearch}
              >
                Clear
              </button>
            </div>
          </div>
          <p>Filter database appointnments by date</p>
          <div className="row">
            <div className="col-md-6 col-sm-12">
              <div class="input-group input-daterange mb-2">
                <input
                  type="date"
                  class="form-control"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4 col-sm-12">
              <button
                type="button"
                class="btn btn-primary btn-block mb-2"
                onClick={handleFilter}
              >
                Filter
              </button>
            </div>
            <div className="col-md-2 col-sm-12">
              <button
                type="button"
                class="btn btn-primary btn-block mb-3"
                onClick={clearSearch}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-12 d-flex justify-content-center">
          {loading && (
            <div className="spinner-border" role="status">
              <span className="sr-only">Searching for appointment</span>
            </div>
          )}
        </div>
        {notFound && (
          <div className="alert alert-danger" role="alert">
            Appointment could not be found.
          </div>
        )}
      </div>

      <br />
      <div className="row">
        <div className="col-xl-12">
          <div className="tab-content">
            <div id="All" className="tab-pane active fade show">
              <div className="table-responsive">
                {!isNil(appointments) && !isEmpty(appointments) && (
                  <table
                    id="example2"
                    className="table card-table display dataTablesCard"
                  >
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>PON</th>
                        <th>Company </th>
                        <th>Location</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments?.map((appointment, index) => (
                        <tr key={index}>
                          <td>{appointment?.id}</td>
                          <td>{appointment?.usersWhoCanManage[0]?.name}</td>
                          <td>{appointment?.details?.purchaseOrderNumber}</td>
                          <td>{appointment?.details?.company.name}</td>
                          <td>{appointment?.details?.clinic}</td>
                          <td>{appointment?.details?.date}</td>
                          <td>
                            <span
                              className={`badge ${getBadgeclassName(
                                appointment?.status
                              )}`}
                            >
                              {appointment?.status}
                            </span>
                          </td>
                          <td>
                            <Link
                              to={`/appointment/${appointment?.id}`}
                              className="btn btn-xs btn-light  text-nowrap"
                            >
                              Open
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {(isNil(appointments) || isEmpty(appointments)) && (
                  <NoAppointments>
                    <div className="d-flex">
                      <h1>No appointments</h1>
                    </div>
                  </NoAppointments>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="event-tabs mb-3 mr-3">
        <StyledUL className="nav nav-tabs" role="tablist">
          <li className="nav-item">
            <a
              className={`nav-link ${type === "approved" ? "active" : ""}`}
              onClick={() => getPageAppointments(page === 0 ? 0 : page - 1)}
            >
              Prev Page
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${type === "pending" ? "active" : ""}`}
              onClick={() => getPageAppointments(page + 1)}
            >
              Next Page
            </a>
          </li>
          {repeat("i", pageCount).map((i, index) => (
            <li className="nav-item">
              <a
                className={`nav-link ${page === index ? "active" : ""}`}
                onClick={() => getPageAppointments(index)}
              >
                Page {index + 1}
              </a>
            </li>
          ))}
        </StyledUL>
      </div>
    </div>
  );
};

export default Appointments;
