import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import NavHeader from "./navHeader";
import Header from "./header";
import { connect } from "react-redux";
import SideBar from "./sidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isNil, isEmpty } from "ramda";
import cookies from "js-cookie";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import moment from "moment";
import { useAdminDataPrefetch } from "../../hooks/useAdminDataPrefetch";
import { adminApi } from "../../lib/adminApi";

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
  margin-left: ${(p) => (p.$sidebarCollapsed ? "4.5rem" : "13.5rem")};
  padding-top: 1rem;
  transition: margin-left 200ms ease;
  @media (max-width: 800px) {
    height: 80vh;
    overflow: scroll;
    margin-left: 0;
    margin-top: 30px;
    .event-tabs {
      margin-right: 0 !important;
    }
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
  const isQuoteOrLoginPage =
    window.location.pathname.includes("quote") ||
    window.location.pathname.includes("login") ||
    window.location.pathname.includes("logout") ||
    window.location.pathname.includes("reset-password");

  useAdminDataPrefetch(user);

  useEffect(() => {
    if (!user || isQuoteOrLoginPage) return;
    const poll = async () => {
      try {
        const data = await adminApi(`/api/admin/recent-activity?since=${encodeURIComponent(lastActivityPoll)}`);
        setLastActivityPoll(data.serverTime || new Date().toISOString());
        const items = (data.items || []).slice(0, 5);
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
    const loadRecentMessages = async () => {
      try {
        const data = await adminApi("/api/admin/messaging/threads?page=0");
        setLatestMessages(
          (data.threads || []).slice(0, 10).map((thread) => ({
            createdAt: thread.lastMessage?.createdAt || thread.date,
            author: thread.lastMessage?.author || { name: thread.userName || thread.companyName || "Client" },
            appointment: thread.appointmentId,
          }))
        );
      } catch (err) {
        console.warn("[recent messages] load failed", err);
      }
    };
    loadRecentMessages();
    const timer = setInterval(loadRecentMessages, 60000);
    return () => clearInterval(timer);
  }, [user, isQuoteOrLoginPage]);

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
  const messageStats = latestMessages.map(m => ({created: m?.createdAt, by: m?.author?.name, type:"msg", id: m.appointment}))
  const latestNotifications = messageStats.sort((a, b) => {
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
        
        <NavHeader toggleOpen={toggleOpen} />
        <Header latestNotifications={latestNotifications} />
        <SideBar
          isOpen={isOpen}
          toggleOpen={toggleOpen}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebarCollapsed}
        />
        <ChildrenContainer className="content-body" $sidebarCollapsed={sidebarCollapsed}>
          {children}
        </ChildrenContainer>
        <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
          {activityToasts.map((item, index) => {
            const to = item.type === "appointment" ? `/appointment/${item.id}` : item.type === "company" ? `/companies/${item.id}/360` : `/client/edit/${item.id}`;
            return (
              <div key={`${item.type}-${item.id}-${index}`} onClick={() => navigate(to)} style={{ cursor: "pointer", background: "#151619", color: "#fff", borderRadius: 8, padding: "10px 12px", minWidth: 260, boxShadow: "0 8px 24px rgba(15,23,42,.18)" }}>
                <strong>New {item.type}</strong>
                <div style={{ fontSize: 12, opacity: .85 }}>{item.label}</div>
              </div>
            );
          })}
        </div>
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
