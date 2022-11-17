import React from "react";
import { Link } from "react-router-dom";
import { MdSpaceDashboard, MdLibraryBooks, MdBusiness, MdPerson, MdHealthAndSafety } from "react-icons/md";
import {HiUserGroup} from "react-icons/hi";
import styled from "styled-components";
import { FaFileInvoiceDollar } from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";

const NavContainer = styled.div`
  .deznav {
    width: 12rem;
  }
  .metismenu {
    li{
      font-size:20px;
    }
  }
  .btn{

    min-width: 160px;

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
            <Link to="/admins" class="has-arrow ai-icon" aria-expanded="false">
              <MdAdminPanelSettings />
              Administrators
            </Link>
          </li>
          <li>
            <Link to="/invoices" class="has-arrow ai-icon" aria-expanded="false">
              <FaFileInvoiceDollar />
              Invoices
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

        <Link to="appointment/create" class="btn btn-sm mt-3 btn-outline-primary ml-3" data-toggle="modal" data-target="#addOrderModalside" >+ New Appointment</Link>
        
        <Link to="company/create" class="btn btn-sm mt-3 btn-outline-primary ml-3" data-toggle="modal" data-target="#addOrderModalside" >+ New Company</Link>
        <Link to="client/create" class="btn btn-sm mt-3 btn-outline-primary ml-3" data-toggle="modal" data-target="#addOrderModalside" >+ New Client</Link>
        <Link to="admin/create" class="btn btn-sm mt-3 btn-outline-primary ml-3" data-toggle="modal" data-target="#addOrderModalside" >+ New Admin</Link>

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
