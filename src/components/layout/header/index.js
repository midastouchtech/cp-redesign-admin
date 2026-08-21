import React, { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import moment from "moment";
import styled from "styled-components";
import {
  MdBusiness,
  MdCalendarToday,
  MdClose,
  MdHistory,
  MdKeyboardArrowDown,
  MdLocationOn,
  MdLogout,
  MdMenu,
  MdNotificationsNone,
  MdOutlineChatBubbleOutline,
  MdPerson,
  MdPersonOutline,
  MdRestore,
  MdSearch,
  MdSettings,
  MdSupportAgent,
} from "react-icons/md";
import { adminApi } from "../../../lib/adminApi";
import { readRecentEntities, subscribeToRecentEntities } from "../../../lib/recentEntities";
import { theme } from "../theme";

function useOnClickOutside(refs, handler) {
  useEffect(() => {
    const listener = (event) => {
      const list = Array.isArray(refs) ? refs : [refs];
      if (list.some((ref) => ref.current && ref.current.contains(event.target))) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refs, handler]);
}

const Bar = styled.header`
  position: fixed;
  top: 0;
  right: 0;
  left: ${(p) => (p.$sidebarCollapsed ? theme.sidebarCollapsedWidth : theme.sidebarWidth)};
  height: ${theme.headerHeight};
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 clamp(16px, 2.4vw, 32px);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid ${theme.inkFaint};
  box-shadow: 0 8px 28px rgba(21, 21, 25, 0.04);
  z-index: 30;
  font-family: "Manrope", -apple-system, sans-serif;
  transition: left 260ms cubic-bezier(.22, .8, .28, 1);

  @media (max-width: 860px) {
    left: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid ${theme.inkFaint};
  background: #fff;
  color: ${theme.ink};
  cursor: pointer;
  flex-shrink: 0;

  @media (max-width: 860px) {
    display: inline-flex;
  }
`;

const Spacer = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

const SearchWrap = styled.div`
  position: relative;
  width: min(38vw, 460px);
  flex-shrink: 1;

  @media (max-width: 900px) {
    display: none;
  }
`;

const SearchBox = styled.div`
  height: 46px;
  border-radius: 14px;
  background: ${theme.paper};
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px 0 14px;
  transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;

  &:focus-within {
    background: #fff;
    border-color: rgba(254, 99, 78, 0.4);
    box-shadow: 0 10px 28px rgba(254, 99, 78, 0.1);
  }

  svg {
    color: ${theme.brand};
    font-size: 19px;
    flex-shrink: 0;
  }

  input {
    border: 0;
    outline: 0;
    flex: 1;
    min-width: 0;
    background: transparent;
    color: ${theme.ink};
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;

    &::placeholder {
      color: ${theme.inkMuted};
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const SearchAction = styled.button`
  border: 0;
  background: ${theme.ink};
  color: #fff;
  border-radius: 10px;
  height: 32px;
  padding: 0 14px;
  font-size: 11.5px;
  font-weight: 800;
  cursor: pointer;
  transition: background 160ms ease, transform 160ms ease;
  flex-shrink: 0;

  &:hover {
    background: ${theme.brand};
    transform: translateY(-1px);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const IconButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
  border-radius: 13px;
  border: 1px solid ${theme.inkFaint};
  background: #fff;
  color: ${theme.ink};
  cursor: pointer;
  flex-shrink: 0;
  font-size: 19px;
  transition: transform 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(254, 99, 78, 0.36);
    color: ${theme.brand};
    box-shadow: 0 10px 24px rgba(254, 99, 78, 0.12);
  }

  &:focus-visible {
    outline: 2px solid ${theme.brand};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Dot = styled.span`
  position: absolute;
  right: 9px;
  top: 9px;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: ${theme.gold};
  border: 2px solid #fff;
`;

const IconGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const Divider = styled.div`
  width: 1px;
  height: 28px;
  background: ${theme.inkFaint};
  margin: 0 2px;
  flex-shrink: 0;

  @media (max-width: 640px) {
    display: none;
  }
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: ${(p) => p.$width || 340};
  max-width: calc(100vw - 24px);
  max-height: 460px;
  overflow: auto;
  padding: 10px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid ${theme.inkFaint};
  box-shadow: 0 28px 68px -12px rgba(21, 21, 25, 0.24);
  animation: menuIn 160ms cubic-bezier(.22, .8, .28, 1) both;
  z-index: 50;

  @keyframes menuIn {
    from { opacity: 0; transform: translateY(-8px) scale(.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const MenuTitle = styled.div`
  color: ${theme.inkMuted};
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 6px 10px 8px;
`;

const MenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 9px 10px;
  border-radius: 12px;
  color: ${theme.ink};
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background 150ms ease, transform 150ms ease, color 150ms ease;

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
    font-size: 18px;
    flex-shrink: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const MenuItemButton = MenuItem.withComponent("button");

const MenuSub = styled.span`
  display: block;
  color: ${theme.inkMuted};
  font-size: 11px;
  font-weight: 600;
  margin-top: 1px;
`;

const EmptyState = styled.div`
  padding: 16px 10px;
  color: ${theme.inkMuted};
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.5;
`;

const ResultRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 50px;
  padding: 8px 10px;
  border-radius: 12px;
  color: ${theme.ink};
  text-decoration: none;
  cursor: pointer;
  transition: background 150ms ease, transform 150ms ease;

  &:hover {
    background: ${theme.paper};
    transform: translateX(2px);
  }

  &:focus-visible {
    outline: 2px solid ${theme.brand};
    outline-offset: -2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const ResultIcon = styled.span`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: ${theme.brandSoft};
  color: ${theme.brand};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`;

const ResultCopy = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
`;

const ResultLabel = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${theme.ink};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ResultType = styled.span`
  font-size: 10.5px;
  font-weight: 700;
  color: ${theme.inkMuted};
  text-transform: capitalize;
`;

const Spinner = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(21, 21, 25, 0.12);
  border-top-color: ${theme.brand};
  animation: spin 700ms linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 1400ms;
  }
`;

const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 10px;
  color: ${theme.inkMuted};
  font-size: 12.5px;
  font-weight: 700;
`;

const ProfileButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 4px 10px 4px 4px;
  border-radius: 16px;
  border: 1px solid ${theme.inkFaint};
  background: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 160ms ease, box-shadow 160ms ease;

  &:hover {
    border-color: rgba(254, 99, 78, 0.32);
    box-shadow: 0 10px 26px rgba(21, 21, 25, 0.07);
  }

  &:focus-visible {
    outline: 2px solid ${theme.brand};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  object-fit: cover;
  background: ${theme.ink};
  box-shadow: 0 0 0 2px #fff, 0 0 0 3px rgba(254, 99, 78, 0.28);
`;

const ProfileCopy = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 100px;
  max-width: 150px;

  @media (max-width: 640px) {
    display: none;
  }
`;

const ProfileName = styled.span`
  color: ${theme.ink};
  font-size: 13px;
  font-weight: 800;
  line-height: 1.1;
`;

const ProfileEmail = styled.span`
  color: ${theme.inkMuted};
  font-size: 11px;
  font-weight: 600;
  max-width: 148px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Chevron = styled(MdKeyboardArrowDown)`
  color: ${theme.inkMuted};
  flex-shrink: 0;
  transition: transform 200ms ease;
  transform: rotate(${(p) => (p.$open ? "180deg" : "0deg")});

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  height:100vh;
  background: rgba(21, 21, 25, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 100;
  animation: fadeIn 180ms ease both;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalCard = styled.div`
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 40px 90px -20px rgba(21, 21, 25, 0.4);
  overflow: hidden;
  animation: modalIn 200ms cubic-bezier(.22, .8, .28, 1) both;
  font-family: "Manrope", -apple-system, sans-serif;

  @keyframes modalIn {
    from { opacity: 0; transform: translateY(10px) scale(.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ModalHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px;
  border-bottom: 1px solid ${theme.inkFaint};
`;

const ModalTitle = styled.h3`
  font-family: "Sora", sans-serif;
  font-size: 17px;
  font-weight: 800;
  color: ${theme.ink};
  margin: 0;
`;

const ModalClose = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 0;
  background: ${theme.paper};
  color: ${theme.ink};
  font-size: 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms ease, color 150ms ease;

  &:hover {
    background: ${theme.brandSoft};
    color: ${theme.brand};
  }
`;

const ModalBody = styled.div`
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SelectField = styled.select`
  height: 44px;
  border-radius: 12px;
  border: 1px solid ${theme.inkFaint};
  background: ${theme.paper};
  padding: 0 12px;
  font-size: 13px;
  font-weight: 700;
  color: ${theme.ink};
  font-family: inherit;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${theme.brand};
    outline-offset: 1px;
  }
`;

const TextArea = styled.textarea`
  min-height: 130px;
  resize: vertical;
  border-radius: 12px;
  border: 1px solid ${theme.inkFaint};
  background: ${theme.paper};
  padding: 12px;
  font-size: 13px;
  font-weight: 600;
  color: ${theme.ink};
  font-family: inherit;
  line-height: 1.5;

  &::placeholder {
    color: ${theme.inkMuted};
  }

  &:focus-visible {
    outline: 2px solid ${theme.brand};
    outline-offset: 1px;
  }
`;

const StatusLine = styled.small`
  color: ${theme.inkSoft};
  font-size: 12px;
  font-weight: 600;
`;

const ModalFoot = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px 20px;
`;

const GhostButton = styled.button`
  height: 40px;
  padding: 0 16px;
  border-radius: 11px;
  border: 1px solid ${theme.inkFaint};
  background: #fff;
  color: ${theme.inkSoft};
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  transition: background 150ms ease;

  &:hover {
    background: ${theme.paper};
  }
`;

const PrimaryButton = styled.button`
  height: 40px;
  padding: 0 18px;
  border-radius: 11px;
  border: 0;
  background: linear-gradient(135deg, ${theme.brand}, ${theme.brandLight});
  color: #fff;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(254, 99, 78, 0.28);
  transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 30px rgba(254, 99, 78, 0.34);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Header = ({ user, latestNotifications, sidebarCollapsed, onOpenMobileNav }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [showSupport, setShowSupport] = useState(false);
  const [supportCategory, setSupportCategory] = useState("request");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportStatus, setSupportStatus] = useState("");
  const [showRecent, setShowRecent] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recent, setRecent] = useState(() => readRecentEntities());

  const searchRef = useRef(null);
  const recentRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useOnClickOutside(searchRef, () => {
    setSearchResults(null);
    setSearchLoading(false);
  });
  useOnClickOutside(recentRef, () => setShowRecent(false));
  useOnClickOutside(notifRef, () => setShowNotifications(false));
  useOnClickOutside(profileRef, () => setShowProfileMenu(false));

  useEffect(() => {
    const loadRecent = () => setRecent(readRecentEntities());
    loadRecent();
    return subscribeToRecentEntities(loadRecent);
  }, []);

  const runSearch = async () => {
    if (search.trim().length < 2) return;
    setSearchLoading(true);
    try {
      const data = await adminApi(`/api/admin/search?q=${encodeURIComponent(search.trim())}`);
      setSearchResults(data.results || {});
    } finally {
      setSearchLoading(false);
    }
  };

  const RESULT_ICONS = {
    companies: MdBusiness,
    users: MdPersonOutline,
    appointments: MdCalendarToday,
    sites: MdLocationOn,
  };

  const openSupport = () => {
    setShowProfileMenu(false);
    setSupportStatus("");
    setShowSupport(true);
  };

  const submitSupport = async () => {
    if (!supportMessage.trim()) return;
    setSupportStatus("Sending your note...");
    try {
      await adminApi("/api/admin/support-tickets", {
        method: "POST",
        body: JSON.stringify({
          category: supportCategory,
          message: supportMessage,
          submittedByUserId: user?.id,
          submittedByName: `${user?.details?.name || ""} ${user?.details?.surname || ""}`.trim(),
          submittedByEmail: user?.details?.email,
        }),
      });
      setSupportMessage("");
      setSupportStatus("Support request sent.");
    } catch (err) {
      setSupportStatus("We could not send that right now. Please try again.");
    }
  };

  const resultLink = (type, item) => {
    if (type === "companies") return `/companies/${item.id}/360`;
    if (type === "users") return item.role === "admin" ? `/admin/edit/${item.id}` : `/client/edit/${item.id}`;
    if (type === "appointments") return `/appointment/${item.id}`;
    if (type === "sites") return `/sites/${item._id}`;
    return "/employees";
  };

  const resultLabel = (type, item) =>
    item.details?.name ||
    item.details?.company?.name ||
    item.displayName ||
    item.name ||
    item.details?.email ||
    item.id ||
    item._id;

  const displayName = `${user?.details?.name || ""} ${user?.details?.surname || ""}`.trim() || "Admin";

  return (
    <Bar $sidebarCollapsed={sidebarCollapsed}>
      <MobileMenuButton type="button" onClick={onOpenMobileNav} aria-label="Open navigation">
        <MdMenu />
      </MobileMenuButton>

      <SearchWrap ref={searchRef}>
        <SearchBox>
          <MdSearch aria-hidden="true" />
          <input
            type="text"
            placeholder="Search companies, users, appointments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            aria-label="Search"
          />
          <SearchAction type="button" onClick={runSearch}>Search</SearchAction>
        </SearchBox>
        {(searchLoading || searchResults) && (
          <Menu $width={380}>
            <IconButton
              type="button"
              onClick={() => {
                setSearchResults(null);
                setSearchLoading(false);
              }}
              style={{ position: "absolute", top: 10, right: 10, minWidth: 32, height: 32, borderRadius: 9, fontSize: 15 }}
              aria-label="Close search results"
            >
              <MdClose />
            </IconButton>
            <MenuTitle>Search results</MenuTitle>
            {searchLoading ? (
              <LoadingRow>
                <Spinner /> Searching...
              </LoadingRow>
            ) : (
              <>
                {Object.entries(searchResults).map(([type, items]) => {
                  const Icon = RESULT_ICONS[type] || MdSearch;
                  return (
                    (items || []).length > 0 && (
                      <div key={type}>
                        <MenuTitle>{type}</MenuTitle>
                        {items.map((item) => (
                          <ResultRow key={`${type}-${item.id || item._id}`} to={resultLink(type, item)} onClick={() => setSearchResults(null)}>
                            <ResultIcon><Icon /></ResultIcon>
                            <ResultCopy>
                              <ResultLabel>{resultLabel(type, item)}</ResultLabel>
                              <ResultType>{type}</ResultType>
                            </ResultCopy>
                          </ResultRow>
                        ))}
                      </div>
                    )
                  );
                })}
                {!Object.values(searchResults).some((items) => items?.length) && (
                  <EmptyState>No matches yet. Try a company name, user, or appointment ID.</EmptyState>
                )}
              </>
            )}
          </Menu>
        )}
      </SearchWrap>

      <Spacer />

      <IconGroup>
        <div ref={recentRef} style={{ position: "relative" }}>
          <IconButton type="button" onClick={() => setShowRecent((v) => !v)} aria-label="Recently opened">
            <MdHistory />
          </IconButton>
          {showRecent && (
            <Menu $width={310}>
              <MenuTitle>Recently opened</MenuTitle>
              {recent.map((item) => (
                <ResultRow key={`${item.type}-${item.id}`} to={item.to} onClick={() => setShowRecent(false)}>
                  <ResultIcon><MdHistory /></ResultIcon>
                  <ResultCopy>
                    <ResultLabel>{item.label}</ResultLabel>
                    <ResultType>{item.type}</ResultType>
                  </ResultCopy>
                </ResultRow>
              ))}
              {!recent.length && <EmptyState>Open a company or appointment and it will show here.</EmptyState>}
            </Menu>
          )}
        </div>

        <div ref={notifRef} style={{ position: "relative" }}>
          <IconButton type="button" onClick={() => setShowNotifications((v) => !v)} aria-label="Recent messages">
            <MdNotificationsNone />
            {!!latestNotifications.length && <Dot />}
          </IconButton>
          {showNotifications && (
            <Menu $width={360}>
              <MenuTitle>Recent messages</MenuTitle>
              {latestNotifications.map((n, i) => (
                <ResultRow key={`${n.type}-${n.id}-${i}`} to={`/appointment/${n.id}`} onClick={() => setShowNotifications(false)}>
                  <ResultIcon>
                    {n.type === "app" ? <MdCalendarToday /> : <MdOutlineChatBubbleOutline />}
                  </ResultIcon>
                  <ResultCopy>
                    <ResultLabel>{n.by} {n.type === "app" ? "created a new appointment" : "sent a message"}</ResultLabel>
                    <ResultType style={{ textTransform: "none" }}>{moment(n.created).format("DD MMM YYYY HH:mm")}</ResultType>
                  </ResultCopy>
                </ResultRow>
              ))}
              {!latestNotifications.length && <EmptyState>No recent messages yet.</EmptyState>}
            </Menu>
          )}
        </div>

        <IconButton type="button" onClick={openSupport} aria-label="Request support">
          <MdSupportAgent />
        </IconButton>
      </IconGroup>

      <Divider />

      <div ref={profileRef} style={{ position: "relative" }}>
        <ProfileButton type="button" onClick={() => setShowProfileMenu((v) => !v)} aria-label="Account menu" aria-expanded={showProfileMenu}>
          <Avatar src={user?.details?.picture || "/images/man.png"} alt="" />
          <ProfileCopy>
            <ProfileName>{displayName}</ProfileName>
            <ProfileEmail>{user?.details?.email || ""}</ProfileEmail>
          </ProfileCopy>
          <Chevron $open={showProfileMenu} />
        </ProfileButton>
        {showProfileMenu && (
          <Menu $width={280}>
            <MenuTitle>Account</MenuTitle>
            <MenuItem to="/profile" onClick={() => setShowProfileMenu(false)}>
              <MdPerson />
              <span>Profile<MenuSub>Account details and password</MenuSub></span>
            </MenuItem>
            <MenuItem to="/system-controls" onClick={() => setShowProfileMenu(false)}>
              <MdSettings />
              <span>System<MenuSub>Controls and clinic limits</MenuSub></span>
            </MenuItem>
            <MenuItem to="/recycle-bin" onClick={() => setShowProfileMenu(false)}>
              <MdRestore />
              <span>Recycle Bin<MenuSub>Restore deleted records</MenuSub></span>
            </MenuItem>
            <MenuItem to="/support-tickets" onClick={() => setShowProfileMenu(false)}>
              <MdSupportAgent />
              <span>Support<MenuSub>Tickets and responses</MenuSub></span>
            </MenuItem>
            <MenuItemButton type="button" onClick={openSupport}>
              <MdSupportAgent />
              <span>Request help<MenuSub>Contact support</MenuSub></span>
            </MenuItemButton>
            <MenuItem to="/logout" onClick={() => setShowProfileMenu(false)}>
              <MdLogout />
              <span>Logout<MenuSub>End this session</MenuSub></span>
            </MenuItem>
          </Menu>
        )}
      </div>

      {showSupport && (
        <ModalOverlay onClick={() => setShowSupport(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Request support">
            <ModalHead>
              <ModalTitle>Request support</ModalTitle>
              <ModalClose type="button" onClick={() => setShowSupport(false)} aria-label="Close">
                <MdClose />
              </ModalClose>
            </ModalHead>
            <ModalBody>
              <SelectField value={supportCategory} onChange={(e) => setSupportCategory(e.target.value)}>
                <option value="request">Request</option>
                <option value="complaint">Complaint</option>
                <option value="suggestion">Suggestion</option>
              </SelectField>
              <TextArea
                rows={5}
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Tell us what you need help with."
              />
              {supportStatus && <StatusLine>{supportStatus}</StatusLine>}
            </ModalBody>
            <ModalFoot>
              <GhostButton type="button" onClick={() => setShowSupport(false)}>Close</GhostButton>
              <PrimaryButton type="button" onClick={submitSupport} disabled={!supportMessage.trim()}>Send request</PrimaryButton>
            </ModalFoot>
          </ModalCard>
        </ModalOverlay>
      )}
    </Bar>
  );
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(Header);
