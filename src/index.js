import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import reportWebVitals from "./reportWebVitals";
import styled from "styled-components";
import Layout from "./components/layout";
import io from "socket.io-client";
import Dashboard from "./views/dashboard";
import Appointments from "./views/appointments";
import Companies from "./views/companies";
import Invoices from "./views/invoices";
import CompanyEditor from "./views/companies/company/edit";
import CopmanyCreator from "./views/companies/company/create";
import Clients from "./views/clients";
import ClientEditor from "./views/clients/client/edit";
import ClientCreator from "./views/clients/client/create";
import Admins from "./views/admins";
import AdminEditor from "./views/admins/admin/edit";
import AdminCreator from "./views/admins/admin/create";
import Appointment from "./views/appointments/appointment";
import AppointmentEditor from "./views/appointments/appointment/edit";
import AppointmentCreator from "./views/appointments/appointment/create";
import AppointmentQuotation from "./views/appointments/appointment/quote";
import Login from "./views/login";
import Logout from "./views/logout";
import { Provider } from "react-redux";
import store from "./store";

const Container = styled.div``;

const Main = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_IO_SERVER);
    newSocket.onAny((event, ...args) => {
      console.log(`** Handling:  ${event}`);
      console.log(args);
    });
    setSocket(newSocket);
    return () => newSocket.close();
  }, [setSocket]);

  return (
    <Router>
      <Layout socket={socket}>
        <Routes>
          <Route path="/" element={<Dashboard socket={socket} />} />
          <Route path="/login" element={<Login socket={socket} />} />
          <Route path="/logout" element={<Logout socket={socket} />} />

          <Route
            path="/appointment/:appId"
            element={<Appointment socket={socket} />}
          />
          <Route
            path="/appointment/edit/:appId"
            element={<AppointmentEditor socket={socket} />}
          />
          <Route
            path="/appointment/create"
            element={<AppointmentCreator socket={socket} />}
          />
          <Route
            path="/company/create"
            element={<CopmanyCreator socket={socket} />}
          />

          <Route
            path="/client/create"
            element={<ClientCreator socket={socket} />}
          />
          <Route
            path="/appointment/quote/:appId"
            element={<AppointmentQuotation socket={socket} />}
          />
          <Route
            path="/client/edit/:clientId"
            element={<ClientEditor socket={socket} />}
          />
          <Route
            path="/company/edit/:companyId"
            element={<CompanyEditor socket={socket} />}
          />
          <Route
            path="/appointments"
            element={<Appointments socket={socket} />}
          />
          <Route path="/companies" element={<Companies socket={socket} />} />
          <Route path="/clients" element={<Clients socket={socket} />} />
          <Route path="/invoices" element={<Invoices socket={socket} />} />
          <Route path="/admins" element={<Admins socket={socket} />} />
          <Route
            path="/admin/edit/:adminId"
            element={<AdminEditor socket={socket} />}
          />
          <Route
            path="/admin/create"
            element={<AdminCreator socket={socket} />}
          />
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
