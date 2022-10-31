import React from "react";
import { Link } from "react-router-dom";

const NavHeader = ({ title, onBack }) => {
  return (
    <div className="nav-header">
      <a href="index.html" className="brand-logo">
        <img className="logo-abbr" src="./images/cplogo.png" alt="" />
        <img className="logo-compact" src="./images/cplogo-text.png" alt="" />
        <img className="brand-title" src="./images/cplogo-text.png" alt="" />
      </a>

      <div className="nav-control">
        <div className="hamburger">
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </div>
      </div>
    </div>
  );
};

export default NavHeader;
