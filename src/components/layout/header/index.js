import userEvent from "@testing-library/user-event";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

const Header = ({ title, onBack, user }) => {
  return (
    <div className="header">
      <div className="header-content">
        <nav className="navbar navbar-expand">
          <div className="collapse navbar-collapse justify-content-between">
            <div className="header-left">
              <div className="dashboard_bar">Dashboard</div>
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
              <li className="nav-item dropdown header-profile">
                <a className="nav-link">
                  <img
                    src={user?.details?.picture || "/images/man.png"}
                    width="20"
                    alt=""
                  />
                  <div className="header-info">
                    <span className="text-black">
                      <strong>{user?.details?.name} {user?.details?.surname}</strong>
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
