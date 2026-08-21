import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdSpaceDashboard,
  MdLibraryBooks,
  MdBusiness,
  MdHealthAndSafety,
  MdChevronLeft,
  MdCalendarViewMonth,
  MdOutlineSensors,
  MdCompareArrows,
  MdAdminPanelSettings,
} from "react-icons/md";
import { HiUserGroup } from "react-icons/hi";
import { FaFileInvoiceDollar, FaUsers, FaComments, FaMapMarkerAlt, FaHistory, FaTools } from "react-icons/fa";
import { AiOutlineLineChart } from "react-icons/ai";
import styled, { createGlobalStyle } from "styled-components";
import { connect } from "react-redux";
import { theme, FontImport } from "../theme";

const GlobalFont = createGlobalStyle`${FontImport}`;

const Rail = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: ${(p) => (p.$collapsed ? theme.sidebarCollapsedWidth : theme.sidebarWidth)};
  display: flex;
  flex-direction: column;
  background: ${theme.white};
  border-right: 1px solid ${theme.inkFaint};
  box-shadow: 1px 0 0 rgba(21, 21, 25, 0.02), 24px 0 48px -24px rgba(21, 21, 25, 0.12);
  z-index: 40;
  transition: width 260ms cubic-bezier(.22, .8, .28, 1);
  font-family: "Manrope", -apple-system, sans-serif;

  @media (max-width: 860px) {
    width: ${theme.sidebarWidth};
    transform: translateX(${(p) => (p.$mobileOpen ? "0" : "-100%")});
    transition: transform 260ms cubic-bezier(.22, .8, .28, 1);
    box-shadow: 24px 0 60px rgba(21, 21, 25, 0.22);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Overlay = styled.div`
  display: none;
  @media (max-width: 860px) {
    display: ${(p) => (p.$show ? "block" : "none")};
    position: fixed;
    inset: 0;
    background: rgba(21, 21, 25, 0.42);
    z-index: 39;
    animation: fadeIn 200ms ease both;
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  }
`;

const BrandRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  height: ${theme.headerHeight};
  padding: ${(p) => (p.$collapsed ? "0" : "0 20px")};
  justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
  border-bottom: 1px solid ${theme.inkFaint};
  flex-shrink: 0;
  text-decoration: none;
  cursor: pointer;

  &:hover .brand-mark {
    transform: translateY(-1px) scale(1.02);
  }
`;

const BrandMark = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: contain;
  background: ${theme.paper};
  padding: 4px;
  box-shadow: 0 8px 18px rgba(254, 99, 78, 0.16);
  transition: transform 180ms ease;
  flex-shrink: 0;
`;

const BrandText = styled.div`
  display: ${(p) => (p.$collapsed ? "none" : "flex")};
  flex-direction: column;
  min-width: 0;
`;

const BrandTitle = styled.span`
  font-family: "Sora", sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: ${theme.ink};
  letter-spacing: -0.01em;
  line-height: 1.15;
  white-space: nowrap;
`;

const BrandSub = styled.span`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${theme.brand};
  margin-top: 2px;
`;

const Scroll = styled.nav`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 12px 8px;

  scrollbar-width: thin;
  scrollbar-color: rgba(21, 21, 25, 0.14) transparent;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background-color: rgba(21, 21, 25, 0.14); border-radius: 999px; }
  &::-webkit-scrollbar-thumb:hover { background-color: rgba(21, 21, 25, 0.26); }
`;

const Section = styled.div`
  margin-bottom: 18px;
  animation: sectionIn 320ms ease both;
  animation-delay: ${(p) => p.$delay}ms;

  @keyframes sectionIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const SectionTitle = styled.div`
  display: ${(p) => (p.$collapsed ? "none" : "block")};
  color: ${theme.inkMuted};
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  margin: 0 10px 8px;
`;

const ItemList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ItemRow = styled.li`
  position: relative;
`;

const NavLink = styled(Link)`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: ${(p) => (p.$collapsed ? "10px 0" : "10px 12px")};
  justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
  color: ${(p) => (p.$active ? theme.white : theme.inkSoft)};
  background: ${(p) => (p.$active ? `linear-gradient(135deg, ${theme.brand}, ${theme.brandLight})` : "transparent")};
  box-shadow: ${(p) => (p.$active ? "0 10px 24px rgba(254, 99, 78, 0.3)" : "none")};
  text-decoration: none;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease;

  &:hover {
    color: ${(p) => (p.$active ? theme.white : theme.ink)};
    background: ${(p) => (p.$active ? `linear-gradient(135deg, ${theme.brand}, ${theme.brandLight})` : theme.paper)};
    transform: translateX(${(p) => (p.$collapsed ? "0" : "2px")});
  }

  &:focus-visible {
    outline: 2px solid ${theme.brand};
    outline-offset: 2px;
  }

  svg {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const NavLinkCopy = styled.span`
  display: ${(p) => (p.$collapsed ? "none" : "flex")};
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  line-height: 1.2;
`;

const NavLinkSub = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: ${(p) => (p.$active ? "rgba(255,255,255,0.78)" : theme.inkMuted)};
`;

const ActiveDot = styled.span`
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  border-radius: 999px;
  background: ${theme.brand};
  box-shadow: 0 0 10px rgba(254, 99, 78, 0.5);
`;

const Tooltip = styled.span`
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  background: ${theme.ink};
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 7px 10px;
  border-radius: 9px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 140ms ease;
  pointer-events: none;
  z-index: 45;
  box-shadow: 0 12px 28px rgba(21, 21, 25, 0.2);

  ${ItemRow}:hover & {
    opacity: ${(p) => (p.$collapsed ? 1 : 0)};
    visibility: ${(p) => (p.$collapsed ? "visible" : "hidden")};
  }
`;

const PinnedPanel = styled.div`
  display: ${(p) => (p.$collapsed ? "none" : "block")};
  margin: 4px 4px 12px;
  padding: 14px;
  border-radius: 16px;
  background: ${theme.paper};
  border: 1px solid ${theme.inkFaint};
`;

const PinnedLabel = styled.small`
  display: block;
  font-weight: 900;
  font-size: 10px;
  color: ${theme.gold};
  letter-spacing: 0.09em;
  text-transform: uppercase;
  margin-bottom: 9px;
`;

const PinnedButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(254, 99, 78, 0.28);
  background: #fff;
  color: ${theme.brand};
  font-size: 12.5px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, box-shadow 160ms ease;

  &:hover {
    transform: translateY(-1px);
    background: ${theme.brandSoft};
    box-shadow: 0 8px 18px rgba(254, 99, 78, 0.16);
  }

  &:not(:last-child) {
    margin-bottom: 6px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const CollapseToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.$collapsed ? "center" : "flex-end")};
  gap: 8px;
  min-height: 52px;
  padding: 0 18px;
  border: 0;
  border-top: 1px solid ${theme.inkFaint};
  background: ${theme.paper};
  color: ${theme.inkSoft};
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 160ms ease, color 160ms ease;

  &:hover {
    color: ${theme.brand};
    background: ${theme.brandSoft};
  }

  &:focus-visible {
    outline: 2px solid ${theme.brand};
    outline-offset: -2px;
  }

  svg {
    font-size: 18px;
    transform: rotate(${(p) => (p.$collapsed ? "180deg" : "0deg")});
    transition: transform 260ms cubic-bezier(.22, .8, .28, 1);
  }

  @media (max-width: 860px) {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    svg { transition: none; }
  }
`;

const NAV_SECTIONS = [
  {
    title: "Command",
    items: [
      { to: "/", label: "Dashboard", subLabel: "Today", icon: MdSpaceDashboard, key: "dashboard" },
      { to: "/x-ray-appointments", label: "Appointments", subLabel: "X-ray", icon: MdLibraryBooks, key: "xray-appointments", xrayOnly: true },
      { to: "/appointments", label: "Appointments", subLabel: "Medicals", icon: MdLibraryBooks, key: "appointments", hideForXray: true },
      { to: "/companies", label: "Companies", subLabel: "360 profiles", icon: MdBusiness, key: "companies", activePaths: ["/companies"] },
      { to: "/availability", label: "Availability", subLabel: "Capacity", icon: MdCalendarViewMonth, key: "availability" },
      { to: "/employees", label: "Employees", subLabel: "Directory", icon: FaUsers, key: "employees" },
    ],
  },
  {
    title: "Bookings",
    items: [
      { to: "/messaging", label: "Messaging", subLabel: "Threads", icon: FaComments, key: "messaging" },
    ],
  },
  {
    title: "Directory",
    items: [
      { to: "/clients", label: "Clients", subLabel: "Users", icon: HiUserGroup, key: "clients" },
      { to: "/admins", label: "Administrators", subLabel: "Staff", icon: MdAdminPanelSettings, key: "admins" },
      { to: "/sites", label: "Sites", subLabel: "Locations", icon: FaMapMarkerAlt, key: "sites", activePaths: ["/sites"] },
      { to: "/sites/duplicates", label: "Site Duplicates", subLabel: "Merge queue", icon: MdCompareArrows, key: "site-duplicates" },
    ],
  },
  {
    title: "Finance & Audit",
    items: [
      { to: "/invoices", label: "Invoices", subLabel: "Sent", icon: FaFileInvoiceDollar, key: "invoices" },
      { to: "/x-ray-reports", label: "Reports", subLabel: "X-ray", icon: MdHealthAndSafety, key: "xray-reports", xrayOnly: true },
      { to: "/reports", label: "Reports", subLabel: "Medicals", icon: MdHealthAndSafety, key: "reports", hideForXray: true },
      { to: "/audit", label: "Audit", subLabel: "Timeline", icon: FaHistory, key: "audit" },
      { to: "/system-controls", label: "Operations", subLabel: "Legacy tools", icon: FaTools, key: "operations" },
    ],
  },
  {
    title: "Insights",
    items: [
      { to: "/analytics", label: "Analytics", subLabel: "Revenue", icon: AiOutlineLineChart, key: "analytics" },
      { to: "/signals", label: "Signals", subLabel: "Attention", icon: MdOutlineSensors, key: "signals" },
    ],
  },
];

const SideBar = ({ isOpen, toggleOpen, user, collapsed, onToggleCollapsed }) => {
  const location = useLocation();
  const isXrayAdmin = user?.details?.adminType === "xrayAdmin";
  const [pinnedCompanies, setPinnedCompanies] = useState([]);

  useEffect(() => {
    const loadPins = () => {
      try {
        setPinnedCompanies(JSON.parse(localStorage.getItem("cp_admin_pinned_companies") || "[]"));
      } catch {
        setPinnedCompanies([]);
      }
    };
    loadPins();
    window.addEventListener("cp:pinned-companies-changed", loadPins);
    return () => window.removeEventListener("cp:pinned-companies-changed", loadPins);
  }, []);

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.xrayOnly) return isXrayAdmin;
      if (item.hideForXray) return !isXrayAdmin;
      return true;
    }),
  })).filter((section) => section.items.length);

  const isActiveItem = (item) => {
    if (item.to === "/") return location.pathname === "/";
    if (item.key === "sites" && location.pathname.startsWith("/sites/duplicates")) return false;
    if (item.activePaths?.some((path) => location.pathname.startsWith(path))) return true;
    return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
  };

  return (
    <>
      <GlobalFont />
      <Overlay $show={isOpen} onClick={toggleOpen} />
      <Rail $collapsed={collapsed} $mobileOpen={isOpen}>
        <BrandRow to="/" $collapsed={collapsed} onClick={() => isOpen && toggleOpen()}>
          <BrandMark className="brand-mark" src="/images/cplogo.png" alt="ClinicPlus" />
          <BrandText $collapsed={collapsed}>
            <BrandTitle>ClinicPlus</BrandTitle>
            <BrandSub>Admin</BrandSub>
          </BrandText>
        </BrandRow>

        <Scroll>
          {sections.map((section, index) => (
            <Section key={section.title} $delay={index * 40}>
              <SectionTitle $collapsed={collapsed}>{section.title}</SectionTitle>
              <ItemList>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveItem(item);
                  return (
                    <ItemRow key={item.key} onClick={() => isOpen && toggleOpen()}>
                      <NavLink to={item.to} $active={active} $collapsed={collapsed} aria-current={active ? "page" : undefined}>
                        {active && !collapsed && <ActiveDot />}
                        <Icon aria-hidden="true" />
                        <NavLinkCopy $collapsed={collapsed}>
                          <span>{item.label}</span>
                          {item.subLabel && <NavLinkSub $active={active}>{item.subLabel}</NavLinkSub>}
                        </NavLinkCopy>
                      </NavLink>
                      {collapsed && <Tooltip $collapsed={collapsed}>{item.label}</Tooltip>}
                    </ItemRow>
                  );
                })}
              </ItemList>
            </Section>
          ))}

          {pinnedCompanies.length > 0 && (
            <PinnedPanel $collapsed={collapsed}>
              <PinnedLabel>Pinned 360</PinnedLabel>
              {pinnedCompanies.map((company) => (
                <PinnedButton
                  key={company.id}
                  to={`/companies/${company.id}/360`}
                  onClick={() => isOpen && toggleOpen()}
                >
                  {company.name}
                </PinnedButton>
              ))}
            </PinnedPanel>
          )}
        </Scroll>

        <CollapseToggle
          type="button"
          onClick={onToggleCollapsed}
          $collapsed={collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {!collapsed && <span>Collapse</span>}
          <MdChevronLeft aria-hidden="true" />
        </CollapseToggle>
      </Rail>
    </>
  );
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(SideBar);
