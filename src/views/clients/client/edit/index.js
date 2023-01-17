import moment from "moment";
import { assoc, assocPath, equals } from "ramda";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import Uploader from "../../../../components/Upload";

function App({ socket }) {
  let params = useParams();
  const navigate = useNavigate();

  const [bodyItem, setBodyItem] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setDBUser] = useState({});
  const [originalUser, setOriginalUser] = useState({});
  const [hasUpdatedUser, setHasUpdatedUser] = useState(false);
  const [passwordType, setPasswordType] = useState("password")

  const togglePasswordType = () => {
    if(passwordType === "password"){
      setPasswordType("text")
    }
    else{
      setPasswordType("password")
    }
  }
  if (socket && isLoading) {
    socket.emit("GET_USER", { id: params.clientId });
    socket.on("RECEIVE_USER", (client) => {
      //console.log("client page RECEIVE_client", client);
      setIsLoading(false);
      setDBUser(client);
      setOriginalUser(client);
    });
    socket.on("DATABASE_UPDATED", (u) => {
      //console.log("Database updated FROM CLient PAGE");
      socket.emit("GET_USER", { id: params.appId });
    });
  }

  const setDetail = (key, value) => {
    setDBUser(assocPath(["details", key], value, user));
  };

  const setPassword = (key, value) => {
    setDBUser(assocPath(["password"], value, user));
  };

  const resetDBUserToOriginal = () => {
    setDBUser(originalUser);
  };

  //console.log(user);

  const saveUser = () => {
    //console.log("saving appza");
    socket.emit("UPDATE_USER", user);
    socket.on("USER_UPDATED", () => {
      //console.log("user updated");
      //console.log("navigating to", " /client/edit/" + user.id);
      navigate("/clients");
    });
  };

  useEffect(() => {
    const hasUpdatedUser = !equals(user, originalUser);
    setHasUpdatedUser(hasUpdatedUser);
  });

  return (
    <div class="container-fluid">
      <div class="row">
        <div className="col-xl-12 col-lg-12">
          <div className="card">
            <div className="card-body">
              <button
                className={`btn btn-primary btn-outline-primary mr-1`}
                onClick={() => navigate("/clients")}
                disabled={hasUpdatedUser}
              >
                Close
              </button>
              <button
                className={`btn mr-1 ${
                  hasUpdatedUser ? "btn-primary" : "btn-secondary"
                }`}
                onClick={saveUser}
                disabled={!hasUpdatedUser}
              >
                Save User
              </button>
              <button
                className={`btn ${
                  hasUpdatedUser ? "btn-link" : "btn-secondary"
                }`}
                onClick={resetDBUserToOriginal}
                disabled={!hasUpdatedUser}
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
                    <label class="col-sm-4 col-form-label">Password</label>
                    <div class="col-sm-8">
                      <div class="input-group mb-3">
                        <input
                          class="form-control input-default"
                          placeholder="enter password"
                          type={passwordType}
                          onChange={(e) =>
                            setPassword("password", e.target.value)
                          }
                          value={user?.password}
                        />                        
                          <span onClick={togglePasswordType} class="btn btn-primary" id="basic-addon2">
                            See Password
                          </span>
                      </div>
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
                          setDBUser(assoc("isSuspended", true, user))
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
                          setDBUser(assoc("isSuspended", false, user))
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
            <div class="card-header">Companies Managing</div>
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
            <div class="card-header">Appointments Managing</div>
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
                          <Link to={`/appointment/${a.id}`}>Open</Link>
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
