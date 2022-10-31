import React from "react";
import { Link } from "react-router-dom";

const SideBar = ({ title, onBack }) => {
  return (
    <div class="deznav">
      <div class="deznav-scroll">
        <ul class="metismenu" id="menu">
          <li>
            <Link to="/" class="has-arrow ai-icon" aria-expanded="false">
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/appointments"
              class="has-arrow ai-icon"
              aria-expanded="false"
            >
              Appointments
            </Link>
          </li>
          <li>
            <Link to="clients" class="has-arrow ai-icon" aria-expanded="false">
              Clients
            </Link>
          </li>
          <li>
            <Link to="/doctors" class="has-arrow ai-icon" aria-expanded="false">
              Doctors
            </Link>
          </li>
          <li>
            <Link to="/profile" class="has-arrow ai-icon" aria-expanded="false">
              Profile
            </Link>
          </li>
        </ul>

        {/* <div class="copyright">
					<p><strong>Acara Ticketing Dashboard</strong> © 2021 All Rights Reserved</p>
					<p>Made with <span class="heart"></span> by DexignZone</p>
				</div> */}
      </div>
    </div>
  );
};

export default SideBar;
