import { isEmpty, isNil } from "ramda";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import cookies from "js-cookie";

function App({ socket }) {
  let navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPassword , setForgotPassword] = useState(false);

  const togleForotPassword = () => {
    setForgotPassword(!forgotPassword);
  }


  const doLogin = () => {
    setLoading(true);
    socket.emit("DO_LOGIN_ADMIN", { email, password });
    socket.on("RECEIVE_LOGIN_USER_FAILED", (user) => {
      setLoading(false);
      setError(user.error);
    });
    socket.on("RECEIVE_LOGIN_USER_SUCCESS", (user) => {
      cookies.set("clinicplus_admin_logged_in_user", user.id, { expires: 3 });
      setError("");
      setLoading(false);
      window.location.replace("/");
    });
  };

  const sendResetLink = () => {
    setLoading(true);
    socket.emit("SEND_RESET_LINK", { email });
    socket.on("RECEIVE_RESET_LINK_SUCCESS", (user) => {
      setLoading(false);
      setError(user.message);
    });
    socket.on("RECEIVE_RESET_LINK_FAILED", (user) => {
      setLoading(false);
      setError(user.error);
    });
  };

  //console.log("loading", loading);

  return (
    <div class="h-100 mt-5">
      {/* Festive Season Closure Banner */}
      <div style={{
        width: '100%',
        height: '40px',
        background: '#ffc107',
        padding: '10px',
        textAlign: 'center',
        color: '#000',
        fontWeight: '700',
        marginBottom: '20px'
      }}>
        🎄 Festive season closure: 19 December 2024 - 6 January 2025 for bookings 🎄
      </div>
      
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
                        Sign in your account
                      </h4>
                      {!forgotPassword ? (
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
                            onChange = {(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div class="form-group">
                          <label class="mb-1 text-white">
                            <strong>Password</strong>
                          </label>
                          <input
                            type="password"
                            class="form-control"
                            placeholder="Password"
                            value={password}
                            onChange = {(e) => setPassword(e.target.value)}
                          />
                        </div>
                        <div class="text-center">
                          <button
                            type="submit"
                            class="btn bg-white text-primary btn-block"
                            onClick={(e) => {
                                e.preventDefault();
                                doLogin();
                            }}
                          >
                            Sign Me In
                          </button>
                        </div>
                        <div class="text-center mt-3 text-light">
                            <a href="#" class="text-white" onClick={togleForotPassword}>Forgot Password ?</a>
                            <p>{error}</p>
                        </div>

                      </form>) : (
                        <form>
                          <div class="form-group
                          ">
                            <label class="mb-1 text-white">
                              <strong>Email</strong>
                              </label>
                              <input
                                
                                type="email"
                                class="form-control"
                                placeholder="Type email"
                                value={email}
                                onChange = {(e) => setEmail(e.target.value)}
                              />
                          </div>
                          <div class="text-center">
                            <button
                              type="submit"
                              class="btn bg-white text-primary btn-block"
                              onClick={(e) => {
                                  e.preventDefault();
                                  sendResetLink();
                              }}
                            >
                              Send Reset Link
                            </button>
                          </div>
                          <div class="text-center mt-3 text-light">
                              <a href="#" class="text-white" onClick={togleForotPassword}>Back to Login</a>
                              <p>{error}</p>
                          </div>
                        </form>
                      )}
                                    
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
