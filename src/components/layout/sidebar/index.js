import React from "react";
import { Link } from "react-router-dom";
import { MdSpaceDashboard, MdLibraryBooks, MdBusiness, MdPerson, MdHealthAndSafety } from "react-icons/md";
import {HiUserGroup} from "react-icons/hi";
import styled from "styled-components";

const NavContainer = styled.div`
  .deznav {
    width: 12rem;
  }
  .metismenu {
    li{
      font-size:20px;
    }
  }
`;
const SideBar = ({ title, onBack }) => {
  return (
    <NavContainer>
      <div class="deznav">
      <div class="deznav-scroll">
        <ul class="metismenu mm-show" id="menu">
          <li>
            <Link className="has-arrow ai-icon" to="/" aria-expanded="false">
              <MdSpaceDashboard />
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/appointments"
              class="has-arrow ai-icon"
            >
              <MdLibraryBooks />
              Appointments
            </Link>
          </li>
          <li >
            <Link
              to="/companies"
              class="has-arrow ai-icon"
            >
              <MdBusiness />
              Companies
            </Link>
          </li>
          <li>
            <Link to="/clients" class="has-arrow ai-icon" aria-expanded="false">
              <HiUserGroup />
              Clients
            </Link>
          </li>
          <li>
            <Link to="/doctors" class="has-arrow ai-icon" aria-expanded="false">
              <MdHealthAndSafety />
              Doctors
            </Link>
          </li>
          <li className="has-arrow ai-icon">
            <Link to="/profile" class="has-arrow ai-icon" aria-expanded="false">
              <MdPerson />
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
    </NavContainer>
  );
};

export default SideBar;
