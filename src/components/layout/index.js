import React from "react";
import { Helmet } from "react-helmet";
import NavHeader from "./navHeader";
import Header from './header';
import { connect } from "react-redux";
import SideBar from "./sidebar";

export const Layout = (props) => {
  const { children, socket, saveUser } = props;
  saveUser({ name: "Humphrey", surname : "Odillo", role: "Admin" });
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
      <NavHeader />
      <Header />
      <SideBar />
      <div class="content-body">{children}</div>
      
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
