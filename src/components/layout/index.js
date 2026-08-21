import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "./header";
import { connect } from "react-redux";
import SideBar from "./sidebar";
import FloatingCreate from "./floatingCreate";
import VersionWelcomeModal from "./VersionWelcomeModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isNil, isEmpty, concat } from "ramda";
import cookies from "js-cookie";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import moment from "moment";
import { useAdminDataPrefetch } from "../../hooks/useAdminDataPrefetch";
import { adminApi } from "../../lib/adminApi";
import { theme } from "./theme";
import { MdClose } from "react-icons/md";
import { rememberEntity } from "../../lib/recentEntities";

const ACTIVITY_TOAST_TTL_MS = 8000;

const Banner = styled.div`
    width: 100vw;
    height: 40px;
    background: #d80009;
    padding: 10px;
    text-align: center;
    color: white;
    font-weight: 700;
`
const ChildrenContainer = styled.div`
  margin-left: ${(p) => (p.$sidebarCollapsed ? theme.sidebarCollapsedWidth : theme.sidebarWidth)};
  margin-top: ${theme.headerHeight};
  padding: 1.5rem clamp(16px, 2.4vw, 28px) 2.5rem;
  min-height: calc(100vh - ${theme.headerHeight});
  background:
    radial-gradient(circle at top right, rgba(254, 99, 78, 0.06), transparent 28rem),
    radial-gradient(circle at 0% 100%, rgba(239, 155, 19, 0.05), transparent 24rem),
    ${theme.paper};
  transition: margin-left 260ms cubic-bezier(.22, .8, .28, 1);

  @media (max-width: 860px) {
    margin-left: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const ToastStack = styled.div`
  position: fixed;
  right: 18px;
  bottom: 96px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(360px, calc(100vw - 32px));
  pointer-events: none;
`;

const ToastCard = styled.button`
  position: relative;
  width: 100%;
  min-height: 76px;
  padding: 13px 44px 13px 14px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(254, 99, 78, .18), transparent 44%),
    #151519;
  color: #fff;
  text-align: left;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 18px 44px rgba(15, 23, 42, .28);
  animation: toastIn 220ms cubic-bezier(.22, .8, .28, 1) both;
  transition: transform 160ms ease, box-shadow 160ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 52px rgba(15, 23, 42, .34);
  }

  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translateY(10px) scale(.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
  }
`;

const ToastTitle = styled.strong`
  display: block;
  margin-bottom: 5px;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0;
`;

const ToastText = styled.div`
  color: rgba(255, 255, 255, .78);
  font-size: 12px;
  line-height: 1.45;
`;

const ToastClose = styled.button`
  position: absolute;
  top: 9px;
  right: 9px;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, .1);
  color: rgba(255, 255, 255, .82);
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;

  &:hover {
    background: rgba(255, 255, 255, .2);
    color: #fff;
  }
`;

const exists = (i) => !isNil(i) && !isEmpty(i);

export const Layout = (props) => {
  const [user, setUser] = React.useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("cp_admin_sidebar_collapsed") === "1"
  );
  const [firstLoad, setFirstLoad] = useState(0);
  const [latestAppointments, setLatestAppointments] =useState([]);
  const [latestMessages, setLatestMessages] = useState([]);
  const [systemSettings, setSystemSettings] = useState();
  const [activityToasts, setActivityToasts] = useState([]);
  const [lastActivityPoll, setLastActivityPoll] = useState(() => new Date().toISOString());

  const showLoader = () => {
    setTimeout(() => {
      //console.log("showing loader...");
      setFirstLoad(1);
    }, 2000);
  };

  if (firstLoad === 0) {
    showLoader();
  }

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("cp_admin_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  };
  const { children, socket, saveUser } = props;
  const cookieUser = cookies.get("clinicplus_admin_logged_in_user");
  const navigate = useNavigate();
  const location = useLocation();

  useAdminDataPrefetch(user);

  const isQuoteOrLoginPage =
    window.location.pathname.includes("quote") ||
    window.location.pathname.includes("login") ||
    window.location.pathname.includes("logout") ||
    window.location.pathname.includes("reset-password");

  useEffect(() => {
    if (!user || isQuoteOrLoginPage) return;
    const poll = async () => {
      try {
        const data = await adminApi(`/api/admin/recent-activity?since=${encodeURIComponent(lastActivityPoll)}`);
        setLastActivityPoll(data.serverTime || new Date().toISOString());
        const receivedAt = Date.now();
        const items = (data.items || []).slice(0, 5).map((item) => ({
          ...item,
          toastKey: `${item.type}-${item.id}-${receivedAt}`,
          receivedAt,
        }));
        if (items.length) {
          setActivityToasts((prev) => [...items, ...prev].slice(0, 5));
        }
      } catch (err) {
        console.warn("[recent activity] poll failed", err);
      }
    };
    const timer = setInterval(poll, 45000);
    return () => clearInterval(timer);
  }, [user, isQuoteOrLoginPage, lastActivityPoll]);

  useEffect(() => {
    if (!user || isQuoteOrLoginPage) return;
    const fetchRecentMessages = async () => {
      try {
        const data = await adminApi("/api/admin/messaging/threads?page=0");
        const messages = (data.threads || [])
          .filter((thread) => thread.lastMessage)
          .map((thread) => ({
            created: thread.lastMessage?.createdAt || thread.date,
            by: thread.companyName || thread.userName || thread.appointmentId,
            type: "msg",
            id: thread.appointmentId,
            preview: thread.lastMessage?.message || thread.lastMessage?.text || "",
          }))
          .sort((a, b) => (moment(a.created).isBefore(moment(b.created)) ? 1 : -1))
          .slice(0, 8);
        setLatestMessages(messages);
      } catch (err) {
        console.warn("[recent messages] fetch failed", err);
      }
    };
    fetchRecentMessages();
    const timer = setInterval(fetchRecentMessages, 60000);
    return () => clearInterval(timer);
  }, [user, isQuoteOrLoginPage]);

  useEffect(() => {
    if (!user || isQuoteOrLoginPage) return;
    const path = location.pathname;
    const rememberFromRoute = (entity) => {
      if (entity) rememberEntity(entity);
    };

    const company360Match = path.match(/^\/companies\/([^/]+)\/360$/);
    const companyEditMatch = path.match(/^\/company\/edit\/([^/]+)$/);
    const appointmentMatch = path.match(/^\/appointment\/([^/]+)$/);
    const clientMatch = path.match(/^\/client\/edit\/([^/]+)$/);
    const adminMatch = path.match(/^\/admin\/edit\/([^/]+)$/);

    rememberFromRoute(
      company360Match
        ? { type: "company", id: company360Match[1], label: `Company ${company360Match[1]}`, to: path }
        : companyEditMatch
          ? { type: "company", id: companyEditMatch[1], label: `Company ${companyEditMatch[1]}`, to: path }
        : appointmentMatch
          ? { type: "appointment", id: appointmentMatch[1], label: `Appointment ${appointmentMatch[1]}`, to: path }
          : clientMatch
            ? { type: "client", id: clientMatch[1], label: `Client ${clientMatch[1]}`, to: path }
            : adminMatch
              ? { type: "admin", id: adminMatch[1], label: `Admin ${adminMatch[1]}`, to: path }
              : null
    );
  }, [location.pathname, user, isQuoteOrLoginPage]);

  useEffect(() => {
    if (!activityToasts.length) return undefined;
    const timers = activityToasts.map((toast) => {
      const elapsed = Date.now() - (toast.receivedAt || Date.now());
      return setTimeout(() => {
        setActivityToasts((current) => current.filter((item) => item.toastKey !== toast.toastKey));
      }, Math.max(ACTIVITY_TOAST_TTL_MS - elapsed, 0));
    });
    return () => timers.forEach(clearTimeout);
  }, [activityToasts]);

  const dismissActivityToast = (toastKey) => {
    setActivityToasts((current) => current.filter((item) => item.toastKey !== toastKey));
  };

  useEffect(()=>{
    console.log("use effect socket", socket)
    if(socket && !exists(systemSettings)){
      socket.emit("GET_SYSTEM_SETTINGS")
      socket.on("RECEIVE_SYSTEM_SETTINGS", settings => {
        setSystemSettings(settings)
      })
      socket.on("FETCH_SYSTEM_SETTINGS", settings => {
        socket.emit("GET_SYSTEM_SETTINGS")
      })
    }
    if (socket && !exists(user)) {
      if (cookieUser) {
        socket.emit("GET_USER", { id: cookieUser });
      }
      if (
        (isNil(cookieUser) || isEmpty(cookieUser)) &&
        location.pathname !== "/login" &&
        !window.location.pathname.includes("reset-password")
      ) {
        navigate("/login");
      }
      socket.on("RECEIVE_USER", (u) => {
        saveUser(u);
        setUser(u);
        socket.off("RECEIVE_USER");
      });
      socket.on("RECEIVE_LATEST_APPOINTMENTS", (appointments) => {
            setLatestAppointments(appointments);
            console.log("set latest appointments", appointments)
            socket.off('RECEIVE_LATEST_APPOINTMENTS')
          });
      socket.on("RECEIVE_LATEST_MESSAGES", (messages) => {
        setLatestMessages(messages);
            console.log("set latest messages", messages)
            socket.off("RECEIVE_LATEST_MESSAGES")
      });
    }
  
  }, [socket]);
  if (isQuoteOrLoginPage) {
    return (
      <div>
        <Helmet>
          <title>ClinicPlus Bookings</title>
          <meta
            name="description"
            content="ClinicPlus offers comprehensive Occupational Health Management and Consulting service to mines and industries. Our goal is to help our clients manage their occupational health and safety risks."
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="cp-logo-full.png"
          />
          <link href="/cp-logo-full.png" rel="icon" />
          <link href="/cp-logo-full.png" rel="apple-touch-icon" />
          <link
            href="/vendor/bootstrap-select/dist/css/bootstrap-select.min.css"
            rel="stylesheet"
          />
          <link href="/css/style.css" rel="stylesheet" />
          <link
            href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@100;300;400;500;700;900&display=swap"
            rel="stylesheet"
          />
        </Helmet>
        <div>{children}</div>
      </div>
    );
  }
  const appointmentStats = latestAppointments.map(a => ({created: a?.tracking[0]?.date, by: a?.details?.company?.name, type:"app", id: a?.id}))
  const messageStats = latestMessages.map(m => ({
    created: m?.created || m?.createdAt,
    by: m?.by || m?.company || m?.author?.name,
    type: "msg",
    id: m?.id || m?.appointment,
    preview: m?.preview || m?.message || m?.text,
  }))
  const latestNotifications = concat(appointmentStats, messageStats).sort((a, b) => {
    return moment(a.created).isBefore(moment(b.created)) ? 1 : -1;
  });

  return (
    <div>
      <Helmet>
        <title>Admin Dashboard</title>
        <meta
          name="description"
          content="ClinicPlus offers comprehensive Occupational Health Management and Consulting service to mines and industries. Our goal is to help our clients manage their occupational health and safety risks."
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/cp-logo-full.png"
        />
        <link href="/cp-logo-full.png" rel="icon" />
        <link href="/cp-logo-full.png" rel="apple-touch-icon" />
        <link
          href="/vendor/bootstrap-select/dist/css/bootstrap-select.min.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@100;300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      {systemSettings?.admin.underMaintanance && <Banner>Please note the system is under maintanance</Banner>}
      <div id="main-wrapper" className="show">
        <Header latestNotifications={latestNotifications} sidebarCollapsed={sidebarCollapsed} onOpenMobileNav={toggleOpen} />
        <SideBar
          isOpen={isOpen}
          toggleOpen={toggleOpen}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebarCollapsed}
        />
        <ChildrenContainer className="content-body" $sidebarCollapsed={sidebarCollapsed}>
          {children}
        </ChildrenContainer>
        <FloatingCreate />
        <VersionWelcomeModal user={user} />
        <ToastStack aria-live="polite" aria-label="Recent activity notifications">
          {activityToasts.map((item, index) => {
            const to = item.type === "appointment" ? `/appointment/${item.id}` : item.type === "company" ? `/companies/${item.id}/360` : `/client/edit/${item.id}`;
            return (
              <ToastCard key={item.toastKey || `${item.type}-${item.id}-${index}`} type="button" onClick={() => navigate(to)}>
                <ToastClose
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={(event) => {
                    event.stopPropagation();
                    dismissActivityToast(item.toastKey);
                  }}
                >
                  <MdClose />
                </ToastClose>
                <ToastTitle>New {item.type}</ToastTitle>
                <ToastText>{item.label}</ToastText>
              </ToastCard>
            );
          })}
        </ToastStack>
      </div>
    </div>
  );
};

const mapDispatchToProps = (dispatch) => {
  return {
    saveUser: (user) => dispatch({ type: "SAVE_USER", payload: user }),
  };
};

export default connect(null, mapDispatchToProps)(Layout);
