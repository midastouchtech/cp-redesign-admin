import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import reportWebVitals from "./reportWebVitals";
import styled from "styled-components";
import Layout from "./components/layout";
import io from "socket.io-client";
import Dashboard from "./views/dashboard";
import Appointments from "./views/appointments";
import Appointment from "./views/appointments/appointment";

import { Provider } from "react-redux";
import store from "./store";

const Container = styled.div``;

const Main = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(`http://localhost:3067`);
   newSocket.onAny((event, ...args) => {
      console.log(`** Handling:  ${event}`);
      console.log(args)
    });
    setSocket(newSocket);
    return () => newSocket.close();
  }, [setSocket]);
  
  return (
    <Router>
      <Layout socket={socket}>
        <Routes>
          <Route path="/" element={<Dashboard socket={socket} />} />
          <Route
            path="/appointment/:appId"
            element={<Appointment socket={socket} />}
          />
          <Route path="/appointments" element={<Appointments socket={socket} />} />
        </Routes>
      </Layout>
    </Router>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Main />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
