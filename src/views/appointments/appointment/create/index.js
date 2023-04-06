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
  append,
  last,
} from "ramda";
import short from "short-uuid";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Uploader from "../../../../components/Upload";
import { SegmentedControl } from "segmented-control-react";
import { DOVER_PRICE, MEDICAL_SERVICES } from "../../../../config";
import Services from "./services";
import Sites from "./sites";
import SearchModal from "../../../../components/Modal";
import CompanySearch from "../../../../components/Modal/companySearch";
import Comments from "../edit/comments";

const getFormattedPrice = (price) => `R${price.toFixed(2)}`;

const CardBody = styled.div`
  &.minimized {
    display: none;
  }
  &.maximized {
    display: block;
  }
`;
function App({ socket }) {
  const navigate = useNavigate();

  const [bodyItem, setBodyItem] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState({
    details: {
      company: null,
      date: null,
      purchaseOrderNumber: null,
      clinic: "Churchill",
      ndaAccepted: false,
      employees: [],
    },
    usersWhoCanEdit: [],
    usersWhoCanManage: [],
    payment: {
      proofOfPayment: "",
      amount: 0,
    },
    isVoided: false,
    isComplete: false,
    tracking: [],
    messages: [],
    status: "pending",
  });
  const [originalAppointment, setOriginalAppointment] = useState({});
  const [hasUpdatedAppointmnent, setHasUpdatedAppointment] = useState(false);
  const [hasCompletedUpload, setHasCompletedUpload] = useState(false);
  const [show, setShowCompanySearch] = useState(false);
  const [searchParams] = useSearchParams();

  const [appointmentsForDateCount, setAppointmentsForDateCount] = useState();
  const [searchParamCompanyName, setSearchParamCompanyName] = useState(
    searchParams.get("companyName") || null
  );

  const setDetail = (key, value) => {
    //
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
        return employee?.sites && employee?.sites.length > 0
          ? acc + (employee?.sites?.length - 1) * 38.4
          : acc;
      },
      0
    );
    const accessCardPrice = appointment?.details?.employees?.reduce(
      (acc, employee) => {
        const accessCardSites = employee.sites.filter(
          (s) => s.hasAccessCard === true
        );
        return accessCardSites.length > 0
          ? acc + (accessCardSites.length - 1) * 51.2
          : acc;
      },
      0
    );
    const doverPrices = appointment?.details?.employees?.reduce(
      (acc, employee) => {
        const requiresDover = employee.dover?.required;
        return requiresDover ? acc + DOVER_PRICE : acc;
      },
      0
    );
    console.log("doverPrice", doverPrices);
    console.log("servicesPrice", servicesPrice);
    console.log("site price", sitesPrice);
    console.log("accessCardPrice", accessCardPrice);

    const bookingPrice =
      servicesPrice + sitesPrice + accessCardPrice + doverPrices;

    return bookingPrice;
  };

  const saveAppointment = () => {
    const price = calculateBookingPrice();
    const appointmentWithNewPrice = assocPath(
      ["payment", "amount"],
      price,
      appointment
    );
    //
    socket.emit("SAVE_NEW_APPOINTMENT", appointmentWithNewPrice);
    socket.on("APPOINTMENT_ADDED", (data) => {
      //
      navigate("/appointment/" + data.id);
    });
  };

  const selectCompany = (company) => {
    //

    const newAppointment = pipe(
      assocPath(["details", "company"], {
        id: company?.id,
        name: company?.details?.name,
      }),
      assocPath(["usersWhoCanManage"], company?.usersWhoCanManage)
    )(appointment);
    setAppointment(newAppointment);
  };

  const createNewEmployee = () => {
    const newEmployee = {
      id: short.generate(),
      name: "",
      services: [],
      sites: [],
      dover: {
        required: false,
      },
    };
    //
    const newEmployees = [newEmployee, ...appointment?.details?.employees];
    //
    setDetail("employees", newEmployees);
  };

  const removeEmployee = (id) => () => {
    //
    const employee = appointment?.details.employees?.find((e) => e.id === id);
    const newEmployees = without([employee], appointment?.details?.employees);
    setDetail("employees", newEmployees);
  };

  const minimizeEmployee = (id) => () => {
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

  const exists = (i) => !isNil(i) && !isEmpty(i);
  useEffect(() => {
    console.log("use effect appointment", appointment);
    const hasUpdatedAppointmnent = !equals(appointment, originalAppointment);
    setHasUpdatedAppointment(hasUpdatedAppointmnent);
    if (
      socket &&
      exists(appointment?.details?.date) &&
      exists(appointment?.details?.clinic)
    ) {
      socket.emit("GET_APPOINTMENTS_FOR_DATE_COUNT", {
        clinic: appointment.details.clinic,
        date: appointment.details.date,
      });
      socket.on("RECEIVE_APPOINTMENTS_FOR_DATE_COUNT", ({ count }) => {
        console.log("COUNT", count);
        setAppointmentsForDateCount(count);
      });
    }
  });

  if (
    !isNil(searchParamCompanyName) &&
    !isEmpty(searchParamCompanyName) &&
    show === false
  ) {
    setShowCompanySearch(true);
  }

  const clearPrefilledSearchTerm = () => {
    setSearchParamCompanyName(null);
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
              {!(appointmentsForDateCount >= 100) && (
                <button
                  className={`btn mr-1 ${
                    hasUpdatedAppointmnent ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={saveAppointment}
                  disabled={!hasUpdatedAppointmnent}
                >
                  Save
                </button>
              )}
              <button
                className={`btn ${
                  hasUpdatedAppointmnent ? "btn-link" : "btn-secondary"
                }`}
                onClick={resetAppointmentToOriginal}
                disabled={!hasUpdatedAppointmnent}
              >
                Cancel
              </button>
              <br />
              <br />
              {exists(appointmentsForDateCount) && (
                <p>
                  <small class="text-secondary">
                    The number of appointments for {appointment?.details?.date}{" "}
                    at {appointment?.details?.clinic} is{" "}
                    {appointmentsForDateCount} the limit is 100{" "}
                  </small>
                  <br />
                  <small class="text-danger">
                    {appointmentsForDateCount >= 100
                      ? "Please note you won't be able to save this appointment as the limit has been reached."
                      : ""}
                  </small>
                </p>
              )}
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
                        placeholder="company name"
                        disabled
                        value={appointment?.details?.company?.name}
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setShowCompanySearch(true);
                        }}
                        className="btn btn-sm btn-link"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                  <CompanySearch
                    clearPrefilledSearchTerm={clearPrefilledSearchTerm}
                    prefilledSearchTerm={searchParamCompanyName || null}
                    name="companysearch"
                    socket={socket}
                    show={show}
                    onCompanySelect={selectCompany}
                    close={() => setShowCompanySearch(false)}
                  />
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Date</label>
                    <div class="col-sm-8">
                      <input
                        class="form-control input-default "
                        placeholder="select date"
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
                          setDetail(
                            "companyResponsibleForPayment",
                            event.target.value
                          )
                        }
                        value={
                          appointment?.details?.companyResponsibleForPayment
                        }
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
          <button
            className="btn btn-primary mb-2"
            onClick={
              appointment?.details?.employees?.length === 100
                ? () => {}
                : createNewEmployee
            }
          >
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
            <div class="card">
              <div class="card-header">
                <div className="row">
                  <h4 class="col-12 card-title mb-3">{employee?.name} </h4>
                  <div className="col-12 d-flex flex-row">
                    <button
                      className="btn btn-danger btn-xs"
                      onClick={removeEmployee(employee.id)}
                    >
                      {" "}
                      Delete{" "}
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
                              <div className="col-4">
                                {getFormattedPrice(DOVER_PRICE)}
                              </div>
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

export default App;
