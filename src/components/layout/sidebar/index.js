import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MdSpaceDashboard, MdLibraryBooks, MdBusiness, MdHealthAndSafety, MdChevronLeft } from "react-icons/md";
import { HiUserGroup } from "react-icons/hi";
import styled from "styled-components";
import { FaFileInvoiceDollar, FaPlus } from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import { AiOutlineLineChart } from "react-icons/ai";
import { BsFillGearFill } from "react-icons/bs";
import { connect } from "react-redux";

const COLLAPSED_WIDTH = "4.5rem";
const EXPANDED_WIDTH = "13.5rem";

const NavContainer = styled.div`
  .deznav {
    width: ${(p) => (p.$collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH)};
    display: flex;
    flex-direction: column;
    transition: width 200ms ease;
  }

  .deznav-scroll {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .nav-menu-scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 2px;

    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 999px;
    }
    &::-webkit-scrollbar-thumb:hover {
      background-color: #94a3b8;
    }
  }

  .metismenu {
    padding: 8px 10px !important;

    li {
      font-size: 13px;
      position: relative;
      margin: 1px 0;
    }
    li a {
      display: flex !important;
      align-items: center;
      justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
      gap: 10px;
      white-space: nowrap;
      overflow: hidden;
      padding: 9px 10px !important;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.2;
      color: #334155;
    }
    li a:hover {
      background: #f5f7fa;
      color: #1e40af;
    }
    li.mm-active > a {
      background: #eaf0fe;
      color: #1e40af;
    }
    li a svg {
      flex-shrink: 0;
      max-width: 16px !important;
      max-height: 16px !important;
      width: 16px;
      height: 16px;
      margin: 0 !important;
      color: #64748b;
    }
    li.mm-active > a svg,
    li a:hover svg {
      color: #1e40af;
    }
  }

  .nav-label {
    opacity: ${(p) => (p.$collapsed ? 0 : 1)};
    width: ${(p) => (p.$collapsed ? 0 : "auto")};
    transition: opacity 150ms ease;
  }

  .collapse-toggle {
    display: flex;
    align-items: center;
    justify-content: ${(p) => (p.$collapsed ? "center" : "flex-end")};
    padding: 10px 14px;
    border-top: 1px solid #eef1f5;
    flex-shrink: 0;
    cursor: pointer;
    color: #64748b;
    background: #fff;
    &:hover {
      color: #1e40af;
      background: #f5f7fa;
    }
    svg {
      transform: rotate(${(p) => (p.$collapsed ? "180deg" : "0deg")});
      transition: transform 200ms ease;
      font-size: 18px;
    }
  }

  .quick-actions {
    padding: 12px;
    display: ${(p) => (p.$collapsed ? "none" : "flex")};
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
    border-top: 1px solid #eef1f5;
  }

  .quick-actions .btn {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: flex-start;
    margin: 0 !important;
    min-width: 0 !important;
  }

  .nav-tooltip {
    position: relative;
    &:hover .nav-tooltip-label {
      opacity: ${(p) => (p.$collapsed ? 1 : 0)};
      visibility: ${(p) => (p.$collapsed ? "visible" : "hidden")};
    }
  }

  .nav-tooltip-label {
    position: absolute;
    left: calc(${COLLAPSED_WIDTH} + 6px);
    top: 50%;
    transform: translateY(-50%);
    background: #0f172a;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 10px;
    border-radius: 6px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity 120ms ease;
    pointer-events: none;
    z-index: 20;
  }

  @media (max-width: 800px) {
    .deznav {
      width: ${(p) => (p.$collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH)};
      position: absolute;
      &.open {
        width: 100%;
        left: 0;
        height: 90vh;
      }
      &.closed {
        left: -100%;
      }
    }
  }
  @media (max-width: 400px) {
    .deznav {
      &.open {
        width: 100%;
        left: 0;
        height: 82vh;
      }
      &.closed {
        left: -100%;
      }
    }
  }
`;

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: MdSpaceDashboard, key: "dashboard" },
  { to: "/x-ray-appointments", label: "Appointments", icon: MdLibraryBooks, key: "xray-appointments", xrayOnly: true },
  { to: "/appointments", label: "Appointments", icon: MdLibraryBooks, key: "appointments", hideForXray: true },
  { to: "/companies", label: "Companies", icon: MdBusiness, key: "companies" },
  { to: "/clients", label: "Clients", icon: HiUserGroup, key: "clients" },
  { to: "/admins", label: "Administrators", icon: MdAdminPanelSettings, key: "admins" },
  { to: "/invoices", label: "Invoices Sent", icon: FaFileInvoiceDollar, key: "invoices" },
  { to: "/x-ray-reports", label: "Reports", icon: MdHealthAndSafety, key: "xray-reports", xrayOnly: true },
  { to: "/reports", label: "Reports", icon: MdHealthAndSafety, key: "reports", hideForXray: true },
  { to: "/analytics", label: "Analytics", icon: AiOutlineLineChart, key: "analytics" },
  { to: "/operations", label: "System", icon: BsFillGearFill, key: "operations" },
];

const QUICK_ACTIONS = [
  { to: "appointment/create", label: "New Appointment" },
  { to: "company/create", label: "New Company" },
  { to: "client/create", label: "New Client" },
  { to: "admin/create", label: "New Admin" },
];

const SideBar = ({ isOpen, toggleOpen, user, collapsed, onToggleCollapsed }) => {
  const location = useLocation();
  const isXrayAdmin = user?.details?.adminType === "xrayAdmin";

  const items = NAV_ITEMS.filter((item) => {
    if (item.xrayOnly) return isXrayAdmin;
    if (item.hideForXray) return !isXrayAdmin;
    return true;
  });

  return (
    <NavContainer $collapsed={collapsed}>
      <div className={isOpen ? "deznav open" : "deznav closed"}>
        <div className="deznav-scroll">
          <div className="nav-menu-scroll">
            <ul className="metismenu mm-show" id="menu">
              {items.map(({ to, label, icon: Icon, key }) => {
                const active = location.pathname === to;
                return (
                  <li key={key} onClick={toggleOpen} className={active ? "mm-active" : ""}>
                    <Link to={to} className="ai-icon nav-tooltip" aria-expanded="false">
                      <Icon />
                      <span className="nav-label">{label}</span>
                      {collapsed && <span className="nav-tooltip-label">{label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="quick-actions">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="btn btn-sm btn-outline-primary"
                data-toggle="modal"
                data-target="#addOrderModalside"
                onClick={toggleOpen}
              >
                <FaPlus size="0.6rem" /> {action.label}
              </Link>
            ))}
          </div>

          <div
            className="collapse-toggle"
            onClick={onToggleCollapsed}
            role="button"
            tabIndex={0}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onKeyDown={(e) => e.key === "Enter" && onToggleCollapsed()}
          >
            <MdChevronLeft />
          </div>
        </div>
      </div>
    </NavContainer>
  );
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(SideBar);
