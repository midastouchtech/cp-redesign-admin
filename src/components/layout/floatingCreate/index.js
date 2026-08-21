import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import { MdAdd, MdClose } from "react-icons/md";
import { adminApi } from "../../../lib/adminApi";
import { theme, FontImport } from "../theme";

const GlobalFont = createGlobalStyle`${FontImport}`;

const ACTIONS = [
  { to: "appointment/create", label: "New Appointment", control: "block_new_appointments" },
  { to: "company/create", label: "New Company", control: "block_new_companies" },
  { to: "client/create", label: "New Client", control: "block_new_signups" },
  { to: "admin/create", label: "New Admin", control: "block_admin_creation" },
];

const Dock = styled.div`
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  font-family: "Manrope", -apple-system, sans-serif;

  @media (max-width: 640px) {
    right: 16px;
    bottom: 16px;
  }
`;

const Panel = styled.div`
  width: 240px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid ${theme.inkFaint};
  box-shadow: 0 28px 68px -14px rgba(21, 21, 25, 0.28);
  overflow: hidden;
  transform-origin: bottom right;
  animation: panelIn 200ms cubic-bezier(.22, .8, .28, 1) both;

  @keyframes panelIn {
    from { opacity: 0; transform: translateY(8px) scale(.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const PanelHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 10px 16px;
`;

const PanelTitle = styled.span`
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${theme.inkMuted};
`;

const CloseButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 9px;
  border: 0;
  background: ${theme.paper};
  color: ${theme.ink};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;

  &:hover {
    background: ${theme.brandSoft};
    color: ${theme.brand};
  }

  &:focus-visible {
    outline: 2px solid ${theme.brand};
    outline-offset: 2px;
  }
`;

const PanelList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 8px 10px;
  gap: 3px;
`;

const ActionLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 8px 10px;
  border-radius: 11px;
  color: ${theme.ink};
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  opacity: ${(p) => (p.$disabled ? 0.5 : 1)};
  transition: background 150ms ease, color 150ms ease, transform 150ms ease;

  &:hover {
    background: ${theme.paper};
    color: ${theme.brand};
    transform: translateX(2px);
  }

  &:focus-visible {
    outline: 2px solid ${theme.brand};
    outline-offset: -2px;
  }

  svg {
    color: ${theme.brand};
    flex-shrink: 0;
    font-size: 16px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Fab = styled.button`
  width: 56px;
  height: 56px;
  border-radius: 18px;
  border: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${theme.brand}, ${theme.brandLight});
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 16px 32px rgba(254, 99, 78, 0.36);
  transition: transform 200ms cubic-bezier(.22, .8, .28, 1), box-shadow 200ms ease;

  &:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 20px 40px rgba(254, 99, 78, 0.42);
  }

  &:focus-visible {
    outline: 2px solid ${theme.ink};
    outline-offset: 3px;
  }

  svg {
    transition: transform 200ms ease;
    transform: rotate(${(p) => (p.$open ? "45deg" : "0deg")});
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    svg { transition: none; }
  }
`;

const FloatingCreate = () => {
  const [open, setOpen] = useState(true);
  const [controls, setControls] = useState([]);

  useEffect(() => {
    adminApi("/api/admin/platform-controls")
      .then((data) => setControls(data.controls || []))
      .catch(() => setControls([]));
  }, []);

  const controlByKey = new Map(controls.map((control) => [control.key, control]));

  return (
    <>
      <GlobalFont />
      <Dock>
        {open && (
          <Panel role="menu" aria-label="Create new">
            <PanelHead>
              <PanelTitle>Create</PanelTitle>
              <CloseButton type="button" onClick={() => setOpen(false)} aria-label="Collapse create menu">
                <MdClose />
              </CloseButton>
            </PanelHead>
            <PanelList>
              {ACTIONS.map((action) => {
                const control = controlByKey.get(action.control);
                const disabled = !!control?.enabled;
                return (
                  <ActionLink
                    key={action.to}
                    to={action.to}
                    $disabled={disabled}
                    title={disabled ? control?.publicMessage || control?.reason : ""}
                    onClick={(e) => {
                      if (disabled) {
                        e.preventDefault();
                        alert(control?.publicMessage || control?.reason || "This action is temporarily disabled.");
                      }
                    }}
                  >
                    <MdAdd aria-hidden="true" />
                    {action.label}
                  </ActionLink>
                );
              })}
            </PanelList>
          </Panel>
        )}
        <Fab
          type="button"
          $open={open}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse create menu" : "Open create menu"}
          aria-expanded={open}
        >
          <MdAdd aria-hidden="true" />
        </Fab>
      </Dock>
    </>
  );
};

export default FloatingCreate;
