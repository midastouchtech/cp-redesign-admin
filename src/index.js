import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import reportWebVitals from "./reportWebVitals";
import styled from "styled-components";
import io from "socket.io-client";
import Layout from "./components/layout";
import { Provider } from "react-redux";
import store from "./store";
import asyncRoute from './asyncRoute'


const Dashboard = asyncRoute(() => import('./views/dashboard'))
const Appointments= asyncRoute(() => import("./views/appointments"));
const Companies= asyncRoute(() => import("./views/companies"));
const Invoices= asyncRoute(() => import("./views/invoices"));
const CompanyEditor= asyncRoute(() => import("./views/companies/company/edit"));
const CopmanyCreator= asyncRoute(() => import("./views/companies/company/create"));
const Clients= asyncRoute(() => import("./views/clients"));
const ClientEditor= asyncRoute(() => import("./views/clients/client/edit"));
const ClientCreator= asyncRoute(() => import("./views/clients/client/create"));
const Admins= asyncRoute(() => import("./views/admins"));
const AdminEditor= asyncRoute(() => import("./views/admins/admin/edit"));
const AdminCreator= asyncRoute(() => import("./views/admins/admin/create"));
const Appointment= asyncRoute(() => import("./views/appointments/appointment"));
const AppointmentEditor= asyncRoute(() => import("./views/appointments/appointment/edit"));
const AppointmentCreator= asyncRoute(() => import("./views/appointments/appointment/create"));
const AppointmentQuotation= asyncRoute(() => import("./views/appointments/appointment/quote"));
const Login= asyncRoute(() => import("./views/login"));
const Logout= asyncRoute(() => import("./views/logout"));

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
reportWebVitals(console.log);
