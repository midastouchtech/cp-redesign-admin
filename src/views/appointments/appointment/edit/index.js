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
  pipe,
  last,
  append,
} from "ramda";
import short from "short-uuid";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Uploader from "../../../../components/Upload";
import { DOVER_PRICE, MEDICAL_SERVICES } from "../../../../config";
import Services from "./services";
import Sites from "./sites";
import Comments from "./comments";
import UserSearch from "../../../../components/Modal/userSearch";
import { connect } from "react-redux";
import SearchModal from "../../../../components/Modal";
import RemainingSlots from "../RemainingSlots";
import "react-alert-confirm/lib/style.css";
import AlertConfirm from "react-alert-confirm";

const getFormattedPrice = (price) => `R${price.toFixed(2)}`;

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

function App({ socket, stateUser }) {
  let params = useParams();
  const navigate = useNavigate();

  const [bodyItem, setBodyItem] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState({});
  const [originalAppointment, setOriginalAppointment] = useState({});
  const [hasUpdatedAppointmnent, setHasUpdatedAppointment] = useState(false);
  const [show, setShow] = useState(false);
  const [showNdaModal, setNdaModalOpen] = useState(false);
  const [hasRequested , setHasRequested] = useState(false)

  const [ isFullyBooked, setIsFullyBooked] = useState(false);
  const [shouldUpdateCount, setShouldUpdateCount] = useState(true);
  
  useEffect(()=>{
    console.log("use effect socket", socket)
    if (socket && isLoading && hasRequested === false) {
      setHasRequested(true)
      socket.emit("GET_APPOINTMENT", { id: params.appId });
      socket.on("RECEIVE_APPOINTMENT", (appointment) => {
        setIsLoading(false);
        setAppointment(appointment);
        setOriginalAppointment(appointment);
      });
    }
  }, [socket]);
  
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
    const allServicesWithVienna = appointment?.details?.employees?.reduce(
      (acc, employee) => {
        return [...acc, ...employee.services];
      },
      []
    );
    const allServices = allServicesWithVienna.filter(s => s.id !== "vienna-test")
    const servicesPrice = allServices.reduce((acc, service) => {
      return acc + service.price;
    }, 0);
    const sitesPrice = appointment?.details?.employees?.reduce(
      (acc, employee) => {
        return employee?.sites && employee?.sites.length > 0
          ? 38.40
          : acc;
      },
      0
    );
    const accessCardPrice =  appointment?.details?.employees?.reduce(
      (acc, employee) => {
        const accessCardSites = employee.sites.filter(s => s.hasAccessCard === true)
        return accessCardSites.length > 0 ? acc + (accessCardSites.length - 1) * 51.20 : acc;
      }, 0)
    
    const doverPrices =  appointment?.details?.employees?.reduce(
      (acc, employee) => {
        const requiresDover = employee.dover?.required;
        return requiresDover ? acc + DOVER_PRICE : acc;
      }, 0)
      console.log("doverPrice", doverPrices);
      console.log("servicesPrice", servicesPrice);
      console.log("site price", sitesPrice);
      console.log("accessCardPrice", accessCardPrice);
    const bookingPrice = servicesPrice + sitesPrice + accessCardPrice + doverPrices;
    console.log("bookingPrice", bookingPrice);
    return bookingPrice;
  };
  const openFailed= (data) => {
    AlertConfirm({
      title: "Failed",
      desc: "Your appointment could not be updated because the clinic is fully booked for the day. Please try another date.",
      onOk: () => {
      },
      onCancel: () => {
        console.log("cancel");
      },
    });
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
      navigate("/appointment/" + appointment.id)
    });
    socket.on("APPOINTMENT_LIMIT_REACHED", (data) => {
      openFailed();
      socket.off("APPOINTMENT_LIMIT_REACHED")
    });
  };

  const createNewEmployee = () => {
    setShouldUpdateCount(true)
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
    setShouldUpdateCount(true)
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

  const toggleDoverRequested = (id) => {
    const employee = appointment?.details.employees?.find((e) => e.id === id);
    const index = appointment?.details?.employees?.indexOf(employee);
    const employeesWithoutEmployee = without(
      [employee],
      appointment?.details?.employees
    );
    const isRequired = employee.dover?.required;
    const newEmployee = assocPath(["dover", "required"], !isRequired, employee);
    const newEmployees = insert(index, newEmployee, employeesWithoutEmployee);
    setDetail("employees", newEmployees);
  };

  useEffect(() => {
    //console.log("use effect appointment", appointment);
    const hasUpdatedAppointmnent = !equals(appointment, originalAppointment);
    setHasUpdatedAppointment(hasUpdatedAppointmnent);
  });
  console.log(appointment);

  const selectUser = (user) => {
    //console.log("selecting user", user);
    socket.emit("ADD_NEW_APPOINTMENT_TO_MANAGE", {
      userResponsible: stateUser,
      userToUpdate: user,
      appointment: appointment,
    });
    // console.log({
    //   userResponsible: stateUser,
    //   userToUpdate: user,
    //   appointment: appointment,
    // });
    const appointmentAlreadyHasUser = any(
      (u) => u.id === user.id,
      appointment.usersWhoCanManage
    );
    if (appointmentAlreadyHasUser) {
      return;
    }
    const newAppointment = pipe(
      assocPath(
        ["usersWhoCanManage"],
        [
          ...appointment?.usersWhoCanManage,
          { id: user?.id, name: user?.details?.name },
        ]
      )
    )(appointment);
    setAppointment(newAppointment);
  };

  const removeUser = (user) => {
    //console.log("removing user", user);
    socket.emit("REMOVE_APPOINTMENT_FROM_USER", {
      userResponsible: { id: stateUser?.id, name: stateUser?.details?.name },
      userToRemove: user,
      appointment: appointment,
    });
    const newAppointment = pipe(
      assocPath(
        ["usersWhoCanManage"],
        reject((u) => u.id === user.id, appointment.usersWhoCanManage)
      )
    )(appointment);
    setAppointment(newAppointment);
  };
  const handleNdaModalClose = () => {
    setNdaModalOpen(!showNdaModal);
  };

  const perfomDelete = () => {
    //console.log(appointment);
    socket.emit("DELETE_APPOINTMENT", appointment);

    socket.on("APPOINTMENT_DELETE_SUCCESS", () => {
      navigate("/companies");
    });
  };


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
              <button
                className={`btn btn-primary btn-outline-primary ml-1 mr-1`}
                onClick={perfomDelete}
              >
                Delete
              </button>
              <RemainingSlots
                clinic={appointment?.details?.clinic}
                date={appointment?.details?.date}
                employeeCount={appointment?.details?.employees?.length }
                socket={socket}
                onBookingStatusUpdate={ (status) => {setIsFullyBooked(status)}}
                shouldUpdateCount={shouldUpdateCount}
                setShouldUpdateCount={setShouldUpdateCount}
                />
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
                        onChange={(e) => {setDetail("date", e.target.value);setShouldUpdateCount(true)}}
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
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">
                    Company name on medical
                    </label>
                    <div class="col-sm-8">
                      <input
                        type="email"
                        class="form-control input-default "
                        placeholder="Company name on medical"
                        onChange={(event) =>
                          setDetail("companyNameOnMedical", event.target.value)
                        }
                        value={appointment?.details?.companyNameOnMedical}
                      />
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">
                    Company responsible for payment
                    </label>
                    <div class="col-sm-8">
                      <input
                        type="email"
                        class="form-control input-default "
                        placeholder="Company responsible for payment"
                        onChange={(event) =>
                          setDetail("companyResponsibleForPayment", event.target.value)
                        }
                        value={appointment?.details?.companyResponsibleForPayment}
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
              <h4 class="card-title">Forms</h4>
            </div>
            <div class="card-body">
              <ul>
                <li>
                  <a
                    href="/forms/Annexure 3 - Medical Certificate of Fitness.pdf"
                    target="_blank"
                    rel="no_rel"
                  >
                    Annexure 3 - Medical Certificate of Fitness.pdf
                  </a>
                </li>
                <li>
                  <a
                    href="/forms/Man Job Spec.pdf"
                    target="_blank"
                    rel="no_rel"
                  >
                    Man Job Spec.pdf
                  </a>
                </li>
                <li>
                  <a
                    href="/forms/Man Job Spec ClinicPlus.xlsx"
                    target="_blank"
                    rel="no_rel"
                  >
                    Man Job Spec ClinicPlus.xlsx
                  </a>
                </li>
                <li>
                  <a
                    href="/forms/Man Job Spec for Working at Heights and Confined Spaces.xlsx"
                    target="_blank"
                    rel="no_rel"
                  >
                    Man Job Spec for Working at Heights and Confined Spaces.xlsx
                  </a>
                </li>
                <li>
                  <a
                    href="/forms/Non-disclosure agreement 2023.doc"
                    target="_blank"
                    rel="no_rel"
                  >
                    Non-disclosure agreement 2023.doc
                  </a>
                </li>
                <li>
                  <a
                    href="/forms/Record of Hazardous Work DMR.doc"
                    target="_blank"
                    rel="no_rel"
                  >
                    Record of Hazardous Work DMR.doc
                  </a>
                </li>
                <li>
                  <a
                    href="/forms/Training Banking Details Confirmation.pdf"
                    target="_blank"
                    rel="no_rel"
                  >
                    Training Banking Details Confirmation.pdf
                  </a>
                </li>
              </ul>
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
        <div class="col-xl-6 col-lg-6">
          <div class="card">
            <div class="card-header">
              Users who manage this appointment
              <button className="btn btn-primary" onClick={() => setShow(true)}>
                Add User
              </button>
            </div>
            <UserSearch
              show={show}
              setShow={setShow}
              socket={socket}
              close={() => setShow(false)}
              onUserSelect={selectUser}
            />
            <div class="card-body p-0">
              <div class="table-responsive fs-14">
                <table class="table">
                  <thead>
                    <tr>
                      <th>
                        <strong>ID</strong>
                      </th>
                      <th>
                        <strong>Name</strong>
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointment?.usersWhoCanManage?.map((c) => (
                      <tr>
                        <td>{c?.id}</td>
                        <td>{c?.name}</td>
                        <td onClick={() => removeUser(c)}>
                          <button className="btn btn-primary">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                        onChange={(event) => {
                          setDetail("clinic", "Churchill")
                          setShouldUpdateCount(true)
                        }}
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
                        onChange={(event) => {
                          setDetail("clinic", "Hendrina");
                          setShouldUpdateCount(true)
                        }}
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
              <button
                className="btn btn-outline-secondary mb-3"
                onClick={handleNdaModalClose}
              >
                Read NDA
              </button>
              <a
                className="btn btn-outline-secondary mb-3"
                href={appointment?.details?.ndaPdf}
                target="_blank"
                disabled={!appointment?.details?.pdf}
              >
                Download PDF
              </a>
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
          <button className="btn btn-primary mb-2" disabled = {isFullyBooked}  onClick={createNewEmployee
            }>
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
                  <h4 class="col-12 card-title mb-3">{employee?.name} </h4>
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
                    <div class='form-group row'>
                      <br />
                      <br />
                      <p class="col-sm-12">We will have a price increase 1 March 2024.</p>
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
                        Dover Service
                        <br />
                        <small>Only done in Witbank</small>
                      </label>
                      <div class="col-sm-8">
                        <div className="row">
                          <div className="col-12">
                            <div className="row">
                              <div className="col-8">
                                <input
                                  type="checkbox"
                                  id={`dover-checkbox}`}
                                  className="mr-2"
                                  name={"dover test"}
                                  value={employee.dover?.required}
                                  checked={employee.dover?.required}
                                  onClick={() =>
                                    toggleDoverRequested(employee.id)
                                  }
                                />
                                <label htmlFor={`dover-checkbox`}>
                                  Require dover test
                                </label>
                              </div>
                              <div className="col-4">{getFormattedPrice(DOVER_PRICE)}</div>
                            </div>
                          </div>
                        </div>
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
                      <label class="col-sm-4 col-form-label">
                        Extra Job Spec Files
                      </label>
                      <div class="col-sm-8">
                        <div class="card">
                          <div class="card-body">
                            <div class="row">
                              <div class="col-12">
                                <ol>
                                  {employee?.extraJobSpecFiles &&
                                    employee?.extraJobSpecFiles.map((ex) => (
                                      <li>
                                        <small>
                                          <a
                                            href={ex}
                                            target="_blank"
                                            rel="noreferrer"
                                          >
                                            {last(ex.split("/"))}
                                          </a>
                                        </small>
                                      </li>
                                    ))}
                                </ol>
                                <Uploader
                                  onChange={(jobSpecFileUrl) => {
                                    const extraJobSpecFiles =
                                      employee.extraJobSpecFiles;
                                    const newFiles = append(
                                      jobSpecFileUrl,
                                      extraJobSpecFiles
                                    );
                                    setEmployeeDetail(
                                      employee?.id,
                                      "extraJobSpecFiles",
                                      newFiles
                                    );
                                  }}
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

const mapState = (state) => {
  return {
    stateUser: state.auth.user,
  };
};

export default connect(mapState)(App);
