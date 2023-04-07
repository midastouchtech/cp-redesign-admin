import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import NavHeader from "./navHeader";
import Header from "./header";
import { connect } from "react-redux";
import SideBar from "./sidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isNil, isEmpty, concat } from "ramda";
import cookies from "js-cookie";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import moment from "moment";

const ChildrenContainer = styled.div`
  margin-left: 12rem;
  padding-top: 1rem;
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
  const [firstLoad, setFirstLoad] = useState(0);
  const [latestAppointments, setLatestAppointments] =useState([]);
  const [latestMessages, setLatestMessages] = useState([]);
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
  const { children, socket, saveUser } = props;
  const cookieUser = cookies.get("clinicplus_admin_logged_in_user");
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(()=>{
    console.log("use effect socket", socket)
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
  const isQuoteOrLoginPage =
    window.location.pathname.includes("quote") ||
    window.location.pathname.includes("login") ||
    window.location.pathname.includes("logout") ||
    window.location.pathname.includes("reset-password");

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
  const messageStats = latestMessages.map(m => ({created: m?.createdAt, by: m?.author?.name, type:"msg", id: m.appointment}))
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
      <div id="main-wrapper" className="show">
        <NavHeader toggleOpen={toggleOpen} />
        <Header latestNotifications={latestNotifications} />
        <SideBar isOpen={isOpen} toggleOpen={toggleOpen} />
        <ChildrenContainer className="content-body">
          {children}
        </ChildrenContainer>
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
