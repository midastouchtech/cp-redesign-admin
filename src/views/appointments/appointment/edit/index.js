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
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Uploader from "../../../../components/Upload";
import { SegmentedControl } from "segmented-control-react";
import { MEDICAL_SERVICES } from "../../../../config";
import Services from "./services";
import Sites from "./sites";

const exists = (i) => !isNil(i) && !isEmpty(i);
const ChatContainer = styled.div`
  .chatbox {
    position: initial;
  }
  .chatbox .msg_card_body {
    height: calc(100vh - 195px);
    overflow: scroll;
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
      console.log("Database updated FROM APPOINTMENT PAGE");
      socket.emit("GET_APPOINTMENT", { id: params.appId });
    });
  }

  const setDetail = (key, value) => {
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


  const statuses = [
    { name: "Declined" },
    { name: "Pending" },
    { name: "Approved" },
  ];

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
    const servicesPrice = services.reduce((acc, service) => {
      return acc + service.price;
    }, 0);
    const sitesPrice = appointment?.details?.employees?.reduce(
      (acc, employee) => {
        return employee?.sites ? acc + (employee?.sites?.length * 35) : acc
      },
      0
    );
    console.log('servicesPrice', servicesPrice)
    console.log("site price",sitesPrice);
    const bookingPrice = servicesPrice + sitesPrice;
    console.log("bookingPrice", bookingPrice);
    return bookingPrice;
  };

  const saveAppointment = () => {
    const price = calculateBookingPrice();
    const appointmentWithNewPrice = assocPath(["payment", "amount"], price, appointment);
    console.log("saving appza");
    socket.emit("UPDATE_APPOINTMENT", appointmentWithNewPrice);
    socket.on("APPOINTMENT_UPDATED", () => {
      console.log("appointment updated");
      navigate("/appointment-edit/" + appointment.id);
    });
  };

  useEffect(() => {
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
                Save Appointment
              </button>
              <button
                className={`btn ${
                  hasUpdatedAppointmnent ? "btn-link" : "btn-secondary"
                }`}
                onClick={resetAppointmentToOriginal}
                disabled={!hasUpdatedAppointmnent}
              >
                Cancel Changes
              </button>
            </div>
          </div>
        </div>
        <div class="col-xl-6 col-lg-12">
          <div class="card">
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
                        placeholder="col-form-label-sm"
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
                        placeholder="col-form-label"
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
          </div>
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
              <h4 class="card-title">Non disclosure agreement</h4>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-12">
                  {appointment?.details?.ndaUrl && (
                    <p>
                      <a
                        className="btn btn-primary mb-2"
                        href={appointment.details.ndaUrl}
                      >
                        View Uploaded
                      </a>
                    </p>
                  )}
                  <Uploader
                    onChange={(ndaUrl) => setDetail("ndaUrl", ndaUrl)}
                  />
                </div>
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
              <p>You can select one of the two options below to specify wether this appointment has been completed or not.</p>
              <div class="basic-form">
                <form>
                  <div class="form-group">
                    <div class="form-check mb-2">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        checked={appointment?.isComplete === true}
                        onChange={() => setAppointment(assoc("isComplete", true, appointment))}
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
                        onChange={() => setAppointment(assoc("isComplete", false, appointment))}
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

        {appointment?.details?.employees?.map((employee) => (
          <div class="col-xl-6 col-lg-6 col-sm-6">
            <div class="card">
              <div class="card-header">
                <h4 class="card-title">
                  {" "}
                  <span className="badge badge-secondary">Employee</span>{" "}
                  {employee?.name}{" "}
                </h4>
              </div>
              <div class="card-body">
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
                      <label class="col-sm-4 col-form-label">Occupation</label>
                      <div class="col-sm-8">
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Password"
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
                        <Sites employeeSites={employee?.sites || []} onChange={(sites) => setEmployeeDetail(employee.id, "sites", sites)} />
                      </div>
                    </div>
                    <div class="form-group row">
                      <label class="col-sm-4 col-form-label">Services</label>
                      <div class="col-sm-8">
                        <Services selectedServices={employee?.services} onChange={(services) => setEmployeeDetail(employee.id, "services", services)} />
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
                                {appointment?.details.ndaUrl && (
                                  <p>
                                    <a
                                      className="btn btn-primary mb-2"
                                      href={employee?.jobSpecFile}
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
                  </form>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
