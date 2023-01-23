import moment from "moment";
import {
  any,
  assoc,
  has,
  isEmpty,
  isNil,
  values,
  assocPath,
  omit,
  reject,
  without,
  insert,
  keys,
  equals,
} from "ramda";
import short from "short-uuid";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Uploader from "../../../../components/Upload";
import { MEDICAL_SERVICES } from "../../../../config";
import Services from "./services";
import Sites from "./sites";
import Comments from "./comments";

const Card = styled.div`
  height: auto;
`;
const CardBody = styled.div`
  &.minimized {
    display: none;
  }
  &.maximized {
    display: block;
  }
`;

function App({ socket }) {
  let params = useParams();
  const navigate = useNavigate();

  const [bodyItem, setBodyItem] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState({});
  const [originalAppointment, setOriginalAppointment] = useState({});
  const [hasUpdatedAppointmnent, setHasUpdatedAppointment] = useState(false);
  const [hasCompletedUpload, setHasCompletedUpload] = useState(false);

  if (socket && isLoading) {
    socket.emit("GET_APPOINTMENT", { id: params.appId });
    socket.on("RECEIVE_APPOINTMENT", (appointment) => {
      setIsLoading(false);
      setAppointment(appointment);
      setOriginalAppointment(appointment);
    });
    socket.on("DATABASE_UPDATED", (u) => {
      //console.log("Database updated FROM APPOINTMENT PAGE");
      socket.emit("GET_APPOINTMENT", { id: params.appId });
    });
  }

  const setDetail = (key, value) => {
    //console.log("setting detail", key, value)
    setAppointment(assocPath(["details", key], value, appointment));
  };

  const resetAppointmentToOriginal = () => {
    setAppointment(originalAppointment);
  };

  const setEmployeeDetail = (id, key, value) => {
    const employee = appointment?.details.employees?.find((e) => e.id === id);
    const index = appointment?.details?.employees?.indexOf(employee);
    const employeesWithoutEmployee = without(
      [employee],
      appointment?.details?.employees
    );
    const newEmployee = assoc(key, value, employee);
    const newEmployees = insert(index, newEmployee, employeesWithoutEmployee);
    setDetail("employees", newEmployees);
  };

  function saveStatus(status) {
    setAppointment(assoc("status", status, appointment));
  }

  const getActiveClass = (status) => {
    return status === appointment.status ? "btn-primary" : "btn-secondary";
  };

  const calculateBookingPrice = () => {
    const allServices = appointment?.details?.employees?.reduce(
      (acc, employee) => {
        return [...acc, ...employee.services];
      },
      []
    );
    const servicesPrice = allServices.reduce((acc, service) => {
      return acc + service.price;
    }, 0);
    const sitesPrice = appointment?.details?.employees?.reduce(
      (acc, employee) => {
        return employee?.sites && employee?.sites.length > 0 ? acc + (employee?.sites?.length - 1) * 35 : acc;
      },
      0
    );
    //console.log('servicesPrice', servicesPrice)
    //console.log("site price",sitesPrice);
    const bookingPrice = servicesPrice + sitesPrice;
    //console.log("bookingPrice", bookingPrice);
    return bookingPrice;
  };

  const saveAppointment = () => {
    const price = calculateBookingPrice();
    const appointmentWithNewPrice = assocPath(
      ["payment", "amount"],
      price,
      appointment
    );
    //console.log("saving appza");
    socket.emit("UPDATE_APPOINTMENT", appointmentWithNewPrice);
    socket.on("APPOINTMENT_UPDATED", () => {
      //console.log("appointment updated");
      navigate("/appointment/edit/" + appointment.id);
    });
  };

  const createNewEmployee = () => {
    const newEmployee = {
      id: short.generate(),
      name: "",
      idNumber: "",
      comments: [],
      occupation: "",
      services: [],
      sites: [],
    };
    //console.log("new employee", newEmployee);
    const newEmployees = [newEmployee, ...appointment?.details?.employees];
    //console.log("newEmployees", newEmployees);
    setDetail("employees", newEmployees);
  };

  const removeEmployee = (id) => () => {
    //console.log("removing employee", id);
    const employee = appointment?.details.employees?.find((e) => e.id === id);
    const newEmployees = without([employee], appointment?.details?.employees);
    setDetail("employees", newEmployees);
  };

  const minimizeEmployee = (id) => () => {
    console.log("minimizing employee", id);
    const employee = appointment?.details.employees?.find((e) => e.id === id);
    const minimizedEmployee = assoc("isMinimized", true, employee);
    const index = appointment?.details?.employees?.indexOf(employee);
    const employeesWithoutEmployee = without(
      [employee],
      appointment?.details?.employees
    );
    const newEmployees = insert(
      index,
      minimizedEmployee,
      employeesWithoutEmployee
    );

    setDetail("employees", newEmployees);
  };

  const maximizeEmployee = (id) => () => {
    console.log("maximizing employee", id);
    const employee = appointment?.details.employees?.find((e) => e.id === id);
    const maximizedEmployee = assoc("isMinimized", false, employee);
    const index = appointment?.details?.employees?.indexOf(employee);
    const employeesWithoutEmployee = without(
      [employee],
      appointment?.details?.employees
    );
    const newEmployees = insert(
      index,
      maximizedEmployee,
      employeesWithoutEmployee
    );
    setDetail("employees", newEmployees);
  };

  useEffect(() => {
    //console.log("use effect appointment", appointment);
    const hasUpdatedAppointmnent = !equals(appointment, originalAppointment);
    setHasUpdatedAppointment(hasUpdatedAppointmnent);
  });

  return (
    <div class="container-fluid">
      <div class="row">
        <div className="col-xl-12 col-lg-12">
          <div className="card">
            <div className="card-body">
              <button
                className={`btn btn-primary btn-outline-primary mr-1`}
                onClick={() => navigate("/appointment/" + appointment.id)}
                disabled={hasUpdatedAppointmnent}
              >
                Close
              </button>
              <button
                className={`btn mr-1 ${
                  hasUpdatedAppointmnent ? "btn-primary" : "btn-secondary"
                }`}
                onClick={saveAppointment}
                disabled={!hasUpdatedAppointmnent}
              >
                Save
              </button>
              <button
                className={`btn ${
                  hasUpdatedAppointmnent ? "btn-link" : "btn-secondary"
                }`}
                onClick={resetAppointmentToOriginal}
                disabled={!hasUpdatedAppointmnent}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        <div class="col-xl-6 col-lg-12">
          <Card class="card">
            <div class="card-header">
              <h4 class="card-title">Details</h4>
            </div>
            <div class="card-body">
              <div class="basic-form">
                <form>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Company</label>
                    <div class="col-sm-8">
                      <input
                        class="form-control input-default "
                        placeholder="Select company"
                        disabled
                        value={appointment?.details?.company?.name}
                      />
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Date</label>
                    <div class="col-sm-8">
                      <input
                        class="form-control input-default "
                        placeholder="col-form-label-sm"
                        type="date"
                        onChange={(e) => setDetail("date", e.target.value)}
                        value={appointment?.details?.date}
                      />
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">
                      Purchase order number
                    </label>
                    <div class="col-sm-8">
                      <input
                        type="email"
                        class="form-control input-default "
                        placeholder="Purchase order number"
                        onChange={(event) =>
                          setDetail("purchaseOrderNumber", event.target.value)
                        }
                        value={appointment?.details?.purchaseOrderNumber}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </Card>
        </div>
        <div class="col-xl-6 col-lg-6">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">Status</h4>
            </div>
            <div class="card-body">
              <div
                class="btn-group mb-3 col-12"
                role="group"
                aria-label="Basic example"
              >
                <button
                  type="button"
                  className={`btn ${getActiveClass("pending")}`}
                  onClick={() => saveStatus("pending")}
                >
                  Pending
                </button>
                <button
                  type="button"
                  className={`btn ${getActiveClass("approved")}`}
                  onClick={() => saveStatus("approved")}
                >
                  Approved
                </button>
                <button
                  type="button"
                  className={`btn ${getActiveClass("declined")}`}
                  onClick={() => saveStatus("declined")}
                >
                  Declined
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-6 col-lg-12">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">Clinic</h4>
            </div>
            <div class="card-body">
              <div class="basic-form">
                <form>
                  <div class="form-group">
                    <div class="form-check mb-2">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        checked={
                          appointment?.details?.clinic?.toLowerCase() ===
                          "churchill"
                        }
                        value="Churchill"
                        onChange={(event) => setDetail("clinic", "Churchill")}
                      />
                      <label class="form-check-label" for="check1">
                        Churchill
                      </label>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        value="Hendrina"
                        checked={
                          appointment?.details?.clinic?.toLowerCase() ===
                          "hendrina"
                        }
                        onChange={(event) => setDetail("clinic", "Hendrina")}
                      />
                      <label class="form-check-label" for="check2">
                        Hendrina
                      </label>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-6 col-lg-6">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">Non disclosure Agreement</h4>
            </div>
            <div class="card-body">
              <p>
                You can select one of the two options below to specify wether
                the nda terms have been accepted or not.
              </p>
              <div class="basic-form">
                <form>
                  <div class="form-group">
                    <div class="form-check mb-2">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        checked={appointment?.details?.ndaAccepted === true}
                        onChange={() => setDetail("ndaAccepted", true)}
                      />
                      <label class="form-check-label" for="check1">
                        NDA has been accepted.
                      </label>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        checked={appointment?.details?.ndaAccepted === false}
                        onChange={() => setDetail("ndaAccepted", false)}
                      />
                      <label class="form-check-label" for="check2">
                        NDA has not been accepted.
                      </label>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-12 col-lg-12">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">Completion</h4>
            </div>
            <div class="card-body">
              <p>
                You can select one of the two options below to specify wether
                this appointment has been completed or not.
              </p>
              <div class="basic-form">
                <form>
                  <div class="form-group">
                    <div class="form-check mb-2">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        checked={appointment?.isComplete === true}
                        onChange={() =>
                          setAppointment(assoc("isComplete", true, appointment))
                        }
                      />
                      <label class="form-check-label" for="check1">
                        Appointment has been completed.
                      </label>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        checked={appointment?.isComplete === false}
                        onChange={() =>
                          setAppointment(
                            assoc("isComplete", false, appointment)
                          )
                        }
                      />
                      <label class="form-check-label" for="check2">
                        Appointment is still in progress.
                      </label>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-12 col-lg-12 text-center">
          <h2>Employees</h2>
          <button className="btn btn-primary mb-2" onClick={createNewEmployee}>
            {" "}
            Add New Employee{" "}
          </button>
          <br />
          <p>
            This appointment has {appointment?.details?.employees?.length}{" "}
            employees.{" "}
          </p>
        </div>
        {appointment?.details?.employees?.map((employee) => (
          <div class="col-xl-6 col-lg-6 col-sm-6">
            <div
              className={`card ${
                employee.isMinimized ? "minimized" : "maximized"
              }`}
            >
              <div class="card-header">
                <div className="row">
                  <h4 class="col-12 card-title mb-3">
                    {employee?.name}{" "}
                  </h4>
                  <div className="col-12">
                    <button
                      className="btn btn-danger btn-xs"
                      onClick={removeEmployee(employee.id)}
                    >
                      {" "}
                      Delete Employee{" "}
                    </button>
                    <button
                      className="btn btn-outline-warning btn-xs ml-2"
                      onClick={
                        employee?.isMinimized
                          ? maximizeEmployee(employee?.id)
                          : minimizeEmployee(employee?.id)
                      }
                    >
                      {" "}
                      {employee?.isMinimized ? "View" : "Hide"} Details{" "}
                    </button>
                  </div>
                </div>
              </div>
              <CardBody
                className={`card-body ${
                  employee.isMinimized ? "minimized" : "maximized"
                }`}
              >
                <div class="basic-form">
                  <form>
                    <div class="form-group row">
                      <label class="col-sm-4 col-form-label">Name</label>
                      <div class="col-sm-8">
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Name"
                          onChange={(event) =>
                            setEmployeeDetail(
                              employee.id,
                              "name",
                              event.target.value
                            )
                          }
                          value={employee?.name}
                        />
                      </div>
                    </div>
                    <div class="form-group row">
                      <label class="col-sm-4 col-form-label">
                        ID/Passport Number
                      </label>
                      <div class="col-sm-8">
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Identity Number"
                          onChange={(event) =>
                            setEmployeeDetail(
                              employee.id,
                              "idNumber",
                              event.target.value
                            )
                          }
                          value={employee?.idNumber}
                        />
                      </div>
                    </div>
                    <div class="form-group row">
                      <label class="col-sm-4 col-form-label">Occupation</label>
                      <div class="col-sm-8">
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Occupation"
                          onChange={(event) =>
                            setEmployeeDetail(
                              employee.id,
                              "occupation",
                              event.target.value
                            )
                          }
                          value={employee?.occupation}
                        />
                      </div>
                    </div>
                    <div class="form-group row">
                      <label class="col-sm-4 col-form-label">Sites</label>
                      <div class="col-sm-8">
                        <Sites
                          employeeSites={employee?.sites || []}
                          onChange={(sites) =>
                            setEmployeeDetail(employee.id, "sites", sites)
                          }
                        />
                      </div>
                    </div>
                    <div class="form-group row">
                      <label class="col-sm-4 col-form-label">Services</label>
                      <div class="col-sm-8">
                        <Services
                          selectedServices={employee?.services}
                          onChange={(services) =>
                            setEmployeeDetail(employee.id, "services", services)
                          }
                        />
                      </div>
                    </div>
                    <div class="form-group row">
                      <label class="col-sm-4 col-form-label">
                        Job Spec File
                      </label>
                      <div class="col-sm-8">
                        <div class="card">
                          <div class="card-body">
                            <div class="row">
                              <div class="col-12">
                                {employee?.jobSpecFile && (
                                  <p>
                                    <a
                                      className="btn btn-primary mb-2"
                                      href={employee?.jobSpecFile}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      View Uploaded
                                    </a>
                                  </p>
                                )}
                                <Uploader
                                  onChange={(jobSpecFileUrl) =>
                                    setEmployeeDetail(
                                      employee?.id,
                                      "jobSpecFile",
                                      jobSpecFileUrl
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="form-group row">
                      <label class="col-sm-4 col-form-label">Comments</label>
                      <div class="col-sm-8">
                        <Comments
                          employeeComments={employee?.comments ?? []}
                          onChange={(comments) =>
                            setEmployeeDetail(employee.id, "comments", comments)
                          }
                        />
                      </div>
                    </div>
                  </form>
                </div>
              </CardBody>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
