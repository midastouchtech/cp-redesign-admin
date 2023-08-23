import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";
import { replace } from "ramda";

const Container = styled.div``;

function Uploader(props) {
  const download = () => {
    const link = document.createElement("a");
    link.href = props.url;
    link.setAttribute("download", replace("%", " ", props.name.split("?")[0]));
    link.setAttribute("target", "new");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <Container>
      <a onClick={download} href="#">
        File: {replace("%", " ", props.name.split("?")[0])}
      </a>
    </Container>
  );
}

export default Uploader;
