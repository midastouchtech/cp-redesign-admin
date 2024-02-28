import userEvent from "@testing-library/user-event";
import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import moment from "moment";

const Header = ({ title, onBack, user, latestNotifications }) => {
  const [showNotifications, setShow] = useState(false);

  const toggleNotifications = () => {
    setShow(!showNotifications);
  };
  
  return (
    <div className="header">
      <div className="header-content">
        <nav className="navbar navbar-expand">
          <div className="collapse navbar-collapse justify-content-between">
            <div className="header-left">
              <div className="dashboard_bar">{user?.details?.adminType === "xrayAdmin" ? "X-Rays Dashboard" : "Dashboard"}</div>
            </div>
            <ul className="navbar-nav header-right">
              <li className="nav-item">
                <div className="input-group search-area d-xl-inline-flex d-none">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search here..."
                  />
                  <div className="input-group-append">
                    <span className="input-group-text">
                      <a href="javascript:void(0)">
                        <i className="flaticon-381-search-2"></i>
                      </a>
                    </span>
                  </div>
                </div>
              </li>
              <li
                onClick={toggleNotifications}
                class="nav-item dropdown notification_dropdown show"
              >
                <a
                  class="nav-link  ai-icon"
                  href="javascript:void(0)"
                  role="button"
                  data-toggle="dropdown"
                  aria-expanded="true"
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M12.8333 5.91732V3.49998C12.8333 2.85598 13.356 2.33331 14 2.33331C14.6428 2.33331 15.1667 2.85598 15.1667 3.49998V5.91732C16.9003 6.16698 18.5208 6.97198 19.7738 8.22498C21.3057 9.75681 22.1667 11.8346 22.1667 14V18.3913L23.1105 20.279C23.562 21.1831 23.5142 22.2565 22.9822 23.1163C22.4513 23.9761 21.5122 24.5 20.5018 24.5H15.1667C15.1667 25.144 14.6428 25.6666 14 25.6666C13.356 25.6666 12.8333 25.144 12.8333 24.5H7.49817C6.48667 24.5 5.54752 23.9761 5.01669 23.1163C4.48469 22.2565 4.43684 21.1831 4.88951 20.279L5.83333 18.3913V14C5.83333 11.8346 6.69319 9.75681 8.22502 8.22498C9.47919 6.97198 11.0985 6.16698 12.8333 5.91732ZM14 8.16664C12.4518 8.16664 10.969 8.78148 9.87469 9.87581C8.78035 10.969 8.16666 12.453 8.16666 14V18.6666C8.16666 18.8475 8.12351 19.026 8.04301 19.1881C8.04301 19.1881 7.52384 20.2265 6.9755 21.322C6.88567 21.5028 6.89501 21.7186 7.00117 21.8901C7.10734 22.0616 7.29517 22.1666 7.49817 22.1666H20.5018C20.7037 22.1666 20.8915 22.0616 20.9977 21.8901C21.1038 21.7186 21.1132 21.5028 21.0234 21.322C20.475 20.2265 19.9558 19.1881 19.9558 19.1881C19.8753 19.026 19.8333 18.8475 19.8333 18.6666V14C19.8333 12.453 19.2185 10.969 18.1242 9.87581C17.0298 8.78148 15.547 8.16664 14 8.16664Z"
                      fill="#FE634E"
                    ></path>
                  </svg>
                  <div class="pulse-css"></div>
                </a>
                <div
                  class={`dropdown-menu rounded dropdown-menu-right ${
                    showNotifications ? "show" : ""
                  }`}
                >
                  <div
                    id="DZ_W_Notification1"
                    class="widget-media dz-scroll p-3 height380 ps"
                  >
                    <ul class="timeline">
                      {latestNotifications.map((n) => (
                        <Fragment>
                          {n.type === "app" && (
                            <li>
                              <Link to={`/appointment/${n.id}`}>
                                <div class="timeline-panel">
                                  <div class="media-body">
                                    <h6 class="mb-1">
                                      {n.by} created a new appointment.
                                    </h6>
                                    <small class="d-block">
                                      {moment(n.created).format(
                                        "DD MM YYY HH:mm"
                                      )}
                                    </small>
                                  </div>
                                </div>
                              </Link>
                            </li>
                          )}
                          {n.type === "msg" && (
                            <li>
                              <Link to={`/appointment/${n.id}`}>
                                <div class="timeline-panel">
                                  <div class="media-body">
                                    <h6 class="mb-1">{n.by} sent a message.</h6>
                                    <small class="d-block">
                                      {moment(n.created).format(
                                        "DD MM YYY HH:mm"
                                      )}
                                    </small>
                                  </div>
                                </div>
                              </Link>
                            </li>
                          )}
                        </Fragment>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
              <li className="nav-item dropdown header-profile">
                <a className="nav-link">
                  <img
                    src={user?.details?.picture || "/images/man.png"}
                    width="20"
                    alt=""
                  />
                  <div className="header-info">
                    <span className="text-black">
                      <strong>
                        {user?.details?.name} {user?.details?.surname}
                      </strong>
                    </span>
                    <p className="fs-12 mb-0">{user?.details?.email || ""}</p>
                    <small>
                      <Link to="/logout">Logout</Link>
                    </small>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(Header);
