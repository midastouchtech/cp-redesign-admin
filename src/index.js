import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import styled from 'styled-components';
import io from 'socket.io-client';
import Layout from './components/layout';
import { Provider } from 'react-redux';
import store from './store';

import Dashboard from './views/dashboard';
import Appointments from './views/appointments';
import Companies from './views/companies';
import Invoices from './views/invoices';
import CompanyEditor from './views/companies/company/edit';
import CopmanyCreator from './views/companies/company/create';
import Clients from './views/clients';
import ClientEditor from './views/clients/client/edit';
import ClientCreator from './views/clients/client/create';
import Admins from './views/admins';
import AdminEditor from './views/admins/admin/edit';
import AdminCreator from './views/admins/admin/create';
import Appointment from './views/appointments/appointment';
import AppointmentEditor from './views/appointments/appointment/edit';
import AppointmentCreator from './views/appointments/appointment/create';
import AppointmentQuotation from './views/appointments/appointment/quote';
import XAppointments from './views/x-ray-appointments';
import Login from './views/login';
import Logout from './views/logout';
import Reset from './views/reset';
import Reports from './views/reports';
import XReports from './views/x-ray-reports';
import Analytics from './views/analytics';
import Operations from './views/operations';

import './style.css';

const Main = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketoptions = {
      path: '/socket.io',
      transports: ['websocket'],
      secure: true,
    };
    const newSocket = io(process.env.REACT_APP_IO_SERVER, socketoptions);
    newSocket.onAny((event, ...args) => {
      console.log('[INFO] Server is handling', event);
      //console.log(args);
    });
    setSocket(newSocket);
    return () => newSocket.close();
  }, [setSocket]);

  return (
    <Router>
      <Layout socket={socket}>
        <Routes>
          <Route path='/' element={<Dashboard socket={socket} />} />
          <Route path='/login' element={<Login socket={socket} />} />
          <Route path='/logout' element={<Logout socket={socket} />} />

          <Route
            path='/appointment/:appId'
            element={<Appointment socket={socket} />}
          />
          <Route
            path='/reset-password/:token'
            element={<Reset socket={socket} />}
          />
          <Route
            path='/appointment/edit/:appId'
            element={<AppointmentEditor socket={socket} />}
          />
          <Route
            path='/appointment/create'
            element={<AppointmentCreator socket={socket} />}
          />
          <Route
            path='/company/create'
            element={<CopmanyCreator socket={socket} />}
          />

          <Route
            path='/client/create'
            element={<ClientCreator socket={socket} />}
          />
          <Route
            path='/appointment/quote/:appId'
            element={<AppointmentQuotation socket={socket} />}
          />

          <Route
            path='/client/edit/:clientId'
            element={<ClientEditor socket={socket} />}
          />
          <Route
            path='/company/edit/:companyId'
            element={<CompanyEditor socket={socket} />}
          />
          <Route
            path='/appointments'
            element={<Appointments socket={socket} />}
          />
          <Route
            path='/x-ray-appointments'
            element={<XAppointments socket={socket} />}
          />
          <Route path='/reports' element={<Reports socket={socket} />} />
          <Route path='/x-ray-reports' element={<XReports socket={socket} />} />
          <Route path='/analytics' element={<Analytics socket={socket} />} />
          <Route path='/operations' element={<Operations socket={socket} />} />
          <Route path='/companies' element={<Companies socket={socket} />} />
          <Route path='/clients' element={<Clients socket={socket} />} />
          <Route path='/invoices' element={<Invoices socket={socket} />} />
          <Route path='/admins' element={<Admins socket={socket} />} />
          <Route
            path='/admin/edit/:adminId'
            element={<AdminEditor socket={socket} />}
          />
          <Route
            path='/admin/create'
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
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);
