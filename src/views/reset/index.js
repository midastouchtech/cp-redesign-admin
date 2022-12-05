import { isEmpty, isNil } from "ramda";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import cookies from "js-cookie";
import { useParams } from "react-router-dom";
import jwt_decode from "jwt-decode";

function App({ socket }) {
  let params = useParams();
  const { token } = params;

  const payload = jwt_decode(token, "cpredesign");

  console.log("payload", payload);

  let navigate = useNavigate();
  const [email, setEmail] = useState(payload.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const doReset = () => {
    setLoading(true);
    socket.emit("DO_RESET_PASSWORD", { email, password });
    socket.on("RECEIVE_RESET_PASSWORD_SUCCESS", (user) => {
      console.log("success");
      setLoading(false);
      setError(user.message);
    });
    socket.on("RECEIVE_RESET_PASSWORD_FAILED", (user) => {
      console.log("failed");
      setLoading(false);
      setError(user.error);
    });
  };

  return (
    <div class="h-100 mt-5">
      <div class="authincation h-100">
        <div class="container h-100">
          <div class="row justify-content-center h-100 align-items-center">
            <div class="col-md-6">
              <div class="authincation-content">
                <div class="row no-gutters">
                  <div class="col-xl-12">
                    <div class="auth-form">
                      <div class="text-center mb-3">
                        <a href="index.html">
                          <img src="images/cp-logo.svg" alt="" />
                        </a>
                      </div>
                      <h4 class="text-center mb-4 text-white">
                        Reset Password
                      </h4>
                      <form>
                        <div class="form-group">
                          <label class="mb-1 text-white">
                            <strong>Email</strong>
                          </label>
                          <input
                            type="email"
                            class="form-control"
                            placeholder="hello@example.com"
                            value={email}
                            disabled
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div class="form-group">
                          <label class="mb-1 text-white">
                            <strong>Password</strong>
                          </label>
                          <input
                            type="text"
                            class="form-control"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        <div class="text-center">
                          <button
                            type="submit"
                            class="btn bg-white text-primary btn-block"
                            onClick={(e) => {
                              e.preventDefault();
                              doReset();
                            }}
                          >
                            Submit
                          </button>
                          <div class="text-center mt-3 text-light">
                            <p class="mb-0">
                              <Link
                                to="/login"
                              >
                                <button
                                  type="submit"
                                  class="btn btn  btn-info btn-block"
                                >
                                  Sign in
                                </button>
                              </Link>
                            </p>
                            <p>{error}</p>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
