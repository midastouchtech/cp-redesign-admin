import {
  isNil,
  isEmpty,
  repeat,
  insert,
  values,
  flatten,
  without,
  mergeAll,
} from "ramda";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { CSVLink, CSVDownload } from "react-csv";
import { MEDICAL_SERVICES } from "../../config";
import Fuse from "fuse.js";
import moment from "moment";

const ReportTable = styled.table`
  td,
  th {
    min-width: 160px !important;
  }
`;

const NoAppointments = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500px;
  width: 100%;
`;

const formatPrice = (price) => {
  return `R ${price.toFixed(2)}`;
};
const calculateEmployeeCost = (employee) => {
  console.log()
  console.log("Employee", employee.name);
  console.log("Services rendered to employee", employee.services);
  const servicesCost = isEmpty(employee.services)
    ? 0
    : employee?.services?.reduce(
        (acc, service) => acc + service.price,
        0
      );
  console.log("Services cost", servicesCost);
  console.log("Sites", employee?.sites);
  const sitesCost = employee?.sites && employee?.sites.length > 0 ? (employee?.sites?.length - 1) * 38.40 : 0;
  const accessCardSites = employee.sites.filter(s => s.hasAccessCard === true)
  const accessCardCost = accessCardSites.length > 0 ? (accessCardSites.length - 1) * 51.20 : 0;
 
  console.log("Sites cost", sitesCost);
  const totalCost = servicesCost + sitesCost + accessCardCost;
  console.log("Total cost", totalCost);
  return formatPrice(totalCost);
};

const Reports = ({ socket }) => {
  const [appointments, setAppointments] = useState(null);
  const [originalAppointments, setOriginalAppointments] = useState(null);
  const [monthType, setMonthType] = useState("any");
  const [type, setStatusType] = useState("all");
  const [page, setPage] = useState(0);

  const employeeHasServiceWithId = (employee, service) => {
    return employee?.services?.some((s) => s?.id === service);
  };

  const allEmployees = appointments
    ? appointments
        ?.map((a) =>
          a?.details?.employees?.map((e) => ({
            ...e,
            appointment: a?.id,
            purchaseOrderNumber: a?.details?.purchaseOrderNumber,
            company: a?.details?.company?.name,
            clinic: a?.details?.clinic,
            price: calculateEmployeeCost(e),
            sites: e.sites.map(s => s.name).toString(),
            dover: e?.dover?.required ? 1 : 0,
            date: a?.details?.date,
            ...mergeAll(
              values(MEDICAL_SERVICES).map((s) => ({
                [s.id]: employeeHasServiceWithId(e, s?.id) ? 1 : 0,
              }))
            ),
          }))
        )
        .flat()
    : [];
  const csvHeaders = [
    "appointment",
    "purchaseOrderNumber",
    "company",
    "name",
    "idNumber",
    "occupation",
    "sites",
    "clinic",
    "price",
    "date",
    "dover",
    ...values(MEDICAL_SERVICES).map((service) => service.id),
  ];

  const getAllAppointments = () => {
    socket.emit("GET_ALL_APPOINTMENTS", { pageLimit: 50});
    socket.on("RECEIVE_ALL_APPOINTMENTS", (data) => {
      setAppointments(data);
      setOriginalAppointments(data);
    });
  };

  if (socket && !appointments) {
    getAllAppointments();
  }

  const setAppointmentsType = (type) => {
    if (type === "all") {
      setStatusType(type);
      setAppointments(originalAppointments);
    } else {
      const newAppointments = originalAppointments.filter(
        (appointment) => appointment.details?.clinic === type
      );
      setAppointments(newAppointments);
      setStatusType(type);
    }
  };

  const getCurrentMonthsAppointments = (page) => {
    socket.emit("GET_CURRENT_MONTHS_APPOINTMENTS", {
      page,
      pageLimit: 50
    });
    socket.on("RECEIVE_CURRENT_MONTHS_APPOINTMENTS", (data) => {
      setAppointments(data);
      setOriginalAppointments(data);
      setMonthType("current");
      setPage(page);
    });
  };

  const getNextMonthsAppointments = (p) => {
    socket.emit("GET_NEXT_MONTHS_APPOINTMENTS", {
      page: p,
      pageLimit: 50
    });
    socket.on("RECEIVE_NEXT_MONTHS_APPOINTMENTS", (data) => {
      setAppointments(data);
      setOriginalAppointments(data);
      setMonthType("next");
      setPage(p);
    });
  };

  const getPrevMonthsAppointments = (p) => {
    socket.emit("GET_PREVIOUS_MONTHS_APPOINTMENTS", {
      page: p,
      pageLimit: 50
    });
    socket.on("RECEIVE_PREVIOUS_MONTHS_APPOINTMENTS", (data) => {
      setAppointments(data);
      setOriginalAppointments(data);
      setMonthType("prev");
      setPage(p);
    });
  };


  const getTodayAppointments = () => {
    socket.emit("GET_TODAYS_APPOINTMENTS");
    socket.on("RECEIVE_TODAY_APPOINTMENTS", (data) => {
      setAppointments(data);
      setOriginalAppointments(data);
      setMonthType("today");
    });
  };

  const getTomorrowAppointments = () => {
    socket.emit("GET_TOMORROWS_APPOINTMENTS");
    socket.on("RECEIVE_TOMORROW_APPOINTMENTS", (data) => {
      setAppointments(data);
      setOriginalAppointments(data);
      setMonthType("tomorrow");
    });
  };

  const getThisWeekAppointments = () => {
    socket.emit("GET_THIS_WEEKS_APPOINTMENTS");
    socket.on("RECEIVE_THIS_WEEK_APPOINTMENTS", (data) => {
      setAppointments(data);
      setOriginalAppointments(data);
      setMonthType("thisWeek");
    });
  };

  const getThisYearAppointments = () => {
    socket.emit("GET_THIS_YEARS_APPOINTMENTS");
    socket.on("RECEIVE_THIS_YEAR_APPOINTMENTS", (data) => {
      setAppointments(data);
      setOriginalAppointments(data);
      setMonthType("thisYear");
    });
  };

  const functionsByMonth = {
    any: getAllAppointments,
    current: getCurrentMonthsAppointments,
    next: getNextMonthsAppointments,
    prev: getPrevMonthsAppointments,
    today: getTodayAppointments,
    tomorrow: getTomorrowAppointments,
    thisWeek: getThisWeekAppointments,
    thisYear: getThisYearAppointments,
  };

  const getAppointmentsByMonth = (e) => {
    //console.log("getting first set appointments for monthtype", e.target.value);
    const month = e.target.value;
    console.log("month", month);
    if (monthType !== month) {
      functionsByMonth[month](0);
      setMonthType(month);
    }
  };

  const getPageAppointments = (p) => {
    if (monthType === "any") {
      socket.emit("GET_NEXT_PAGE_APPOINTMENTS", { page: p });
      socket.on("RECEIVE_NEXT_PAGE_APPOINTMENTS", (data) => {
        setAppointments(data);
        setOriginalAppointments(data);
        setPage(p);
      });
    } else {
      //console.log("getting next page appointments for", monthType, "month");
      functionsByMonth[monthType](p);
    }
  };

  const fuzzySearchAppointments = (e) => {
    const search = e.target.value;
    if (isNil(search) || isEmpty(search)) {
      setAppointments(originalAppointments);
    } else {
      const result = fuse.search(search);
      if (result.length > 0) {
        setAppointments(result.map((res) => res.item));
      }
    }
  };

  const options = {
    keys: [
      "details.company.name",
      "details.purchaseOrderNumber",
      "details.employees.name",
      "details.date",
      "status",
    ],
  };
  const originalAppointmentsWithReadableDates = originalAppointments?.map(
    (appointment) => {
      return {
        ...appointment,
        details: {
          ...appointment.details,
          date: moment(appointment.details.date).format("DD MMMM YYYY"),
        },
      };
    }
  );

  const fuse = new Fuse(originalAppointmentsWithReadableDates, options);
  console.log("all employees", allEmployees);
  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap mb-2 align-items-center justify-content-between">
        <div className="mb-3 mr-3">
          <h6 className="fs-16 text-black font-w600 mb-0">Employee reports</h6>
          <span className="fs-14">
            Listed below is information for each employee
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search"
            onChange={fuzzySearchAppointments}
          />
        </div>
        <div className="event-tabs mb-3 mr-3">
          <ul className="nav nav-tabs" role="tablist">
            <li className="nav-item">
              <button
                className={`nav-link ${type === "all" ? "active" : ""}`}
                onClick={() => setAppointmentsType("all")}
              >
                All
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${type === "Hendrina" ? "active" : ""}`}
                onClick={() => setAppointmentsType("Hendrina")}
              >
                Hendrina
              </button>
            </li>
            <li className="nav-item">
              <button                className={`nav-link ${type === "Churchill" ? "active" : ""}`}
                onClick={() => setAppointmentsType("Churchill")}
              >
                Churchill
              </button>
            </li>
          </ul>
        </div>
        <div className="d-flex mb-3">
          <select
            className="form-control style-2 default-select mr-3"
            onClick={getAppointmentsByMonth}
          >
            <option value="any" selected={monthType === "any"}>
              All
            </option>
            <option value="today" selected={monthType === "today"}>
              Today
            </option>
            <option value="tomorrow" selected={monthType === "tomorrow"}>
              Tomorrow
            </option>
            <option value="thisWeek" selected={monthType === "thisWeek"}>
              This Week
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
            <option value="thisYear" selected={monthType === "thisYear"}>
              This Year
            </option>
          </select>
          <CSVLink
            headers={csvHeaders}
            data={allEmployees}
            filename={"report.csv"}
            className="btn btn-primary text-nowrap"
          >
            {" "}
            Download CSV
          </CSVLink>
        </div>
      </div>
      <div className="row">
        <div className="col-xl-12">
          <div className="tab-content">
            <div id="All" className="tab-pane active fade show">
              <div className="table-responsive">
                {!isNil(appointments) && !isEmpty(appointments) && (
                  <ReportTable
                    id="example2"
                    className="table card-table display dataTablesCard"
                  >
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>PON</th>
                        <th>Company </th>
                        <th>Employee</th>
                        <th>ID Number</th>
                        <th>Occupation</th>
                        <th>Sites</th>
                        <th>Location</th>
                        <th>Price</th>
                        <th>Date</th>
                        <th>Dover Service</th>
                        {values(MEDICAL_SERVICES).map((service) => (
                          <th>{service.title}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allEmployees.map((employee) => {
                        return (
                          <tr>
                            <td>{employee?.appointment}</td>
                            <td>{employee?.purchaseOrderNumber}</td>
                            <td>{employee?.company}</td>
                            <td>{employee.name}</td>
                            <td>{employee?.idNumber}</td>
                            <td>{employee?.occupation}</td>
                            <td>{employee?.sites?.split(",").map(s => <p>{s}</p>)}</td>
                            <td>{employee?.clinic}</td>
                            <td>{employee?.price}</td>
                            <td>
                              {moment(employee?.date).format("DD MMMM YYYY")}
                            </td>
                            <td>{employee?.dover?.required  ? (
                                  <span className="badge badge-success">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="badge badge-danger">No</span>
                                )} 
                            </td>
                            {values(MEDICAL_SERVICES).map((service) => (
                              <td>
                                {employee[service.id] === 1 ? (
                                  <span className="badge badge-success">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="badge badge-danger">No</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </ReportTable>
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
        <ul className="nav nav-tabs" role="tablist">
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
          {repeat("i", page).map((i, index) => (
            <li className="nav-item">
              <a
                className={`nav-link ${type === "pending" ? "active" : ""}`}
                onClick={() => getPageAppointments(index)}
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

export default Reports;
