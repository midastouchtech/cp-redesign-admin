import React from "react";
import { Helmet } from "react-helmet";
import NavHeader from "./navHeader";
import Header from './header';
import { connect } from "react-redux";
import SideBar from "./sidebar";
import {useState } from 'react';
import { useNavigate } from "react-router-dom";
import { isNil, isEmpty } from "ramda";
import cookies from "js-cookie";
import { useLocation } from "react-router-dom";
import styled from "styled-components";

const ChildrenContainer = styled.div`
margin-left: 12rem;
padding-top: 1rem;
  @media(max-width: 800px) {
    height: 80vh;
    overflow: scroll;
    margin-left: 0;
    margin-top: 30px;
    .event-tabs {
      margin-right: 0 !important;
    }
  }
`

const exists = (i) => !isNil(i) && !isEmpty(i);

export const Layout = (props) => {
  const [user , setUser] = React.useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  const { children, socket, saveUser } = props;
  const cookieUser = cookies.get("clinicplus_admin_logged_in_user");
  const navigate = useNavigate();
  const location = useLocation();
  if (socket && !exists(user)) {

    if (cookieUser) {
      socket.emit("GET_USER", { id: cookieUser });
    }
    if (
      (isNil(cookieUser) || isEmpty(cookieUser)) &&
      location.pathname !== "/login"
    ) {
      navigate("/login");
    }
    socket.on("RECEIVE_USER", (u) => {
      saveUser(u);
      setUser(u);
      socket.off("RECEIVE_USER");
    });

  }
  const isQuoteOrLoginPage = window.location.pathname.includes("quote") || window.location.pathname.includes("login") || window.location.pathname.includes("logout");

  if(isQuoteOrLoginPage) {
    return (
      <div>
        <Helmet>
        <title>Dashboard</title>
        <meta name="description" content="App Description" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon.png" />
        <link href="/vendor/bootstrap-select/dist/css/bootstrap-select.min.css" rel="stylesheet" />
        <link href="/css/style.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@100;300;400;500;700;900&display=swap" rel="stylesheet" />
      </Helmet>
      <div>{children}</div>
      </div>
    )
  };

  return (
    <div>
      <Helmet>
        <title>Dashboard</title>
        <meta name="description" content="App Description" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon.png" />
        <link rel="stylesheet" href="/vendor/chartist/css/chartist.min.css" />
        <link href="/vendor/bootstrap-select/dist/css/bootstrap-select.min.css" rel="stylesheet" />
        <link href="/vendor/owl-carousel/owl.carousel.css" rel="stylesheet" />
        <link href="/css/style.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@100;300;400;500;700;900&display=swap" rel="stylesheet" />
      </Helmet>
      {/* <div id="preloader">
        <div class="sk-three-bounce">
            <div class="sk-child sk-bounce1"></div>
            <div class="sk-child sk-bounce2"></div>
            <div class="sk-child sk-bounce3"></div>
        </div>
    </div> */}
    <div id="main-wrapper" className="show">
      <NavHeader toggleOpen={toggleOpen}/>
      <Header />
      <SideBar isOpen={isOpen} toggleOpen={toggleOpen}/>
      <ChildrenContainer className="content-body">{children}</ChildrenContainer>
      
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
