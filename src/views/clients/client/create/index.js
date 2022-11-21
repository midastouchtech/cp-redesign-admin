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
  pipe,
  equals,
} from "ramda";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Uploader from "../../../../components/Upload";
import { SegmentedControl } from "segmented-control-react";
import CompanySearch from "../../../../components/Modal/companySearch";
import AppointmentSearch from "../../../../components/Modal/appointmentSearch";

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
  const navigate = useNavigate();

  const [bodyItem, setBodyItem] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  const [show, setShowCompanySearch] = useState(false);
  const [showAppSearch, setShowAppointmentSearch] = useState(false);
  const [user, setUser] = useState({
    details: {
      name: "",
      surname: "",
      email: "",
      cell: "",
    },
    appointmentsManaging: [],
    companiesManaging: [],
    isSuspended: false,
    role: "client",
    password: "123456",
    tracking: [],
  });

  const setDetail = (key, value) => {
    setUser(assocPath(["details", key], value, user));
  };

  const saveUser = () => {
    //console.log("saving appza");
    socket.emit("SAVE_NEW_USER", user);
    socket.on("RECEIVE_SAVE_USER_SUCCESS", (data) => {
      //console.log("user added");
      //console.log("navigating to", " /client/edit/" + data.id);
      navigate("/client/edit/" + data.id);
    });
  };

  const selectCompany = (company) => {
    //console.log("selecting company", company);
    const userAlreadyHasCompany = any(
      (c) => c.id === company.id,
      user.companiesManaging
    );
    if (userAlreadyHasCompany) {
      return;
    }
    const newUser = pipe(
      assocPath(
        ["companiesManaging"],
        [
          ...user?.companiesManaging,
          { id: company?.id, name: company?.details?.name },
        ]
      )
    )(user);
    setUser(newUser);
  };

  const removeCompany = (company) => {
    //console.log("removing company", company);
    const newUser = pipe(
      assocPath(
        ["companiesManaging"],
        reject(equals(company), user?.companiesManaging)
      )
    )(user);
    setUser(newUser);
  };

  const selectAppointment = (appointment) => {
    //console.log("selecting appointment", appointment);
    const userAlreadyHasAppointment = any(
      (c) => c.id === appointment.id,
      user.appointmentsManaging
    );
    if (userAlreadyHasAppointment) {
      return;
    }
    const newUser = pipe(
      assocPath(
        ["appointmentsManaging"],
        [
          ...user?.appointmentsManaging,
          { id: appointment?.id, company: appointment?.details?.company?.name },
        ]
      )
    )(user);
    setUser(newUser);
  };

  const removeAppointment = (appointment) => {
    //console.log("removing appointment", appointment);
    const newUser = pipe(
      assocPath(
        ["appointmentsManaging"],
        reject(equals(appointment), user?.appointmentsManaging)
      )
    )(user);
    setUser(newUser);
  };

  return (
    <div class="container-fluid">
      <div class="row">
        <div className="col-xl-12 col-lg-12">
          <div className="card">
            <div className="card-body">
              <button
                className={`btn btn-primary btn-outline-primary mr-1`}
                onClick={() => navigate("/clients")}
              >
                Close
              </button>
              <button className={`btn mr-1 btn-primary`} onClick={saveUser}>
                Save User
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
                    <label class="col-sm-4 col-form-label">
                      Profile Picture
                    </label>
                    <div class="col-sm-8">
                      <Uploader onChange={(url) => setDetail("picture", url)} />
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Name</label>
                    <div class="col-sm-8">
                      <input
                        class="form-control input-default"
                        placeholder="enter name "
                        onChange={(e) => setDetail("name", e.target.value)}
                        value={user?.details?.name}
                      />
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Surname</label>
                    <div class="col-sm-8">
                      <input
                        class="form-control input-default"
                        placeholder="enter surname"
                        onChange={(e) => setDetail("surname", e.target.value)}
                        value={user?.details?.surname}
                      />
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Email</label>
                    <div class="col-sm-8">
                      <input
                        class="form-control input-default"
                        placeholder="enter email"
                        type="email"
                        onChange={(e) => setDetail("email", e.target.value)}
                        value={user?.details?.email}
                      />
                    </div>
                  </div>

                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">
                      Cellphone Number
                    </label>
                    <div class="col-sm-8">
                      <input
                        class="form-control input-default"
                        placeholder="enter 10 digit cell number"
                        onChange={(e) => setDetail("cell", e.target.value)}
                        value={user?.details?.cell}
                      />
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Password</label>
                    <div class="col-sm-8">
                      <input
                        class="form-control input-default"
                        placeholder="enter password"
                        type="text"
                        onChange={(e) =>
                          setUser(assoc("password", e.target.value, user))
                        }
                        value={user?.password}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-6 col-lg-12">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">Suspension</h4>
            </div>
            <div class="card-body">
              <p>
                You can select one of he two options below to suspend a user
                from creating appointments or companies.
              </p>
              <div class="basic-form">
                <form>
                  <div class="form-group">
                    <div class="form-check mb-2">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        checked={user?.isSuspended === true}
                        onChange={() =>
                          setUser(assoc("isSuspended", true, user))
                        }
                      />
                      <label class="form-check-label" for="check1">
                        User is Suspended
                      </label>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        checked={user?.isSuspended === false}
                        onChange={() =>
                          setUser(assoc("isSuspended", false, user))
                        }
                      />
                      <label class="form-check-label" for="check2">
                        User is not suspended
                      </label>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-12">
          <div class="card">
            <div class="card-header">
              Companies Managing
              <button
                className="btn btn-primary"
                onClick={() => setShowCompanySearch(true)}
              >
                Add Company
              </button>
              {show && (
                <CompanySearch
                  name="comsearch"
                  socket={socket}
                  show={show}
                  close={() => setShowCompanySearch(false)}
                  onCompanySelect={selectCompany}
                />
              )}
            </div>
            <div class="card-body p-0">
              <div class="table-responsive fs-14">
                <table class="table">
                  <thead>
                    <tr>
                      <th>
                        <strong>Id</strong>
                      </th>
                      <th>
                        <strong>Name</strong>
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {user?.companiesManaging?.map((c) => (
                      <tr>
                        <td>{c?.id}</td>
                        <td>{c?.name}</td>
                        <td>
                          <Link to={`/company/edit/${c?.id}`}>Open</Link>
                        </td>
                        <td>
                          {" "}
                          <button
                            className="btn btn-primary"
                            onClick={() => removeCompany(c)}
                          >
                            Remove Company
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-12">
          <div class="card">
            <div class="card-header">
              Appointments Managing
              <button
                className="btn btn-primary"
                onClick={() => setShowAppointmentSearch(true)}
              >
                Add Appointment
              </button>
              {showAppSearch && (
                <AppointmentSearch
                  name="appsearch"
                  socket={socket}
                  show={showAppSearch}
                  close={() => setShowAppointmentSearch(false)}
                  onAppointmentSelect={selectAppointment}
                />
              )}
            </div>
            <div class="card-body p-0">
              <div class="table-responsive fs-14">
                <table class="table">
                  <thead>
                    <tr>
                      <th>
                        <strong>Id</strong>
                      </th>
                      <th>
                        <strong>For Company</strong>
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {user?.appointmentsManaging?.map((a) => (
                      <tr>
                        <td>{a?.id}</td>
                        <td>{a?.company}</td>
                        <td>
                          {" "}
                          <button
                            className="btn btn-primary"
                            onClick={() => removeAppointment(a)}
                          >
                            Remove Appointment
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
