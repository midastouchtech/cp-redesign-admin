import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";

import { equals, isNil, keys, mergeAll, range, remove, take, values } from "ramda";
import moment from "moment";
import axios from "axios";

const Wrapper = styled.div`
  width: 100%;
  height: 300px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    overflow-x: scroll;
    height: auto;
  }
`;

const Operations = ({ socket }) => {
  const [events, setEvents] = useState([]);
  const [severIsAlive, setAlive] = useState(null);
  const [dbIsAlive, setDBAlive] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [currentBill, setCurrentBill] = useState(0);
  const [dynoInfo, setDynoInfo] = useState(null);
  const [numberOfDynos, setNumberOfDynos] = useState(0);
  const [restartingDynos, setRestartingDynos] = useState(false);
  const [systemSettings, setSystemSettings] = useState();
  const [hasRequested, setHasRequested] = useState(false);
  console.log(invoices);
  const addEvent = (e) => {
    console.log(e.name);
    const newEvents = [...events, e];
    if (!equals(events, newEvents)) {
      setEvents(newEvents);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.off("LOG");
      socket.on("LOG", (data) => {
        addEvent({
          name: data.event,
          time: moment().format("HH:mm:ss"),
          args: data.args,
        });
      });
    }
    if (socket && !systemSettings && hasRequested === false) {
      setHasRequested(true);
      socket.emit("GET_SYSTEM_SETTINGS");
      socket.on("RECEIVE_SYSTEM_SETTINGS", (settings) => {
        setSystemSettings(settings);
      });
      socket.on("FETCH_SYSTEM_SETTINGS", () => {
        socket.emit("GET_SYSTEM_SETTINGS");
      });
    }
  }, [socket, events]);

  const restartDynos = () => {
    setRestartingDynos(true);
    axios
      .delete(`${process.env.REACT_APP_DYNO_URL}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/vnd.heroku+json; version=3",
          Authorization: `Bearer ${process.env.REACT_APP_HEROKU_TOKEN}`,
        },
      })
      .then(() => {
        setRestartingDynos(false);
      })
      .catch((err) => console.log(err));
  };

  const getDynoInfo = () => {
    axios
      .get(`${process.env.REACT_APP_DYNO_URL}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/vnd.heroku+json; version=3",
          Authorization: `Bearer ${process.env.REACT_APP_HEROKU_TOKEN}`,
        },
      })
      .then((res) => {
        setDynoInfo(res.data[0]);
        setNumberOfDynos(res.data.length);
      })
      .catch((err) => console.log(err));
  };

  const getInvoiceInfo = () => {
    axios
      .get(`https://api.heroku.com/account/invoices`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/vnd.heroku+json; version=3",
          Authorization: `Bearer ${process.env.REACT_APP_HEROKU_TOKEN}`,
        },
      })
      .then((res) => {
        setInvoices(res.data);
        const price = res.data[0].total;
        setCurrentBill(price / 100);
      })
      .catch((err) => console.log(err));
  };

  const checkStatus = () => {
    getDynoInfo();
    getInvoiceInfo();
    axios
      .get(process.env.REACT_APP_IO_SERVER)
      .then(() => {
        setAlive(true);
        axios
          .get(`${process.env.REACT_APP_IO_SERVER}/db-status`)
          .then((res) => setDBAlive(res.data.alive))
          .catch(() => setDBAlive(false));
      })
      .catch(() => setAlive(false));
  };

  useEffect(() => {
    setInterval(checkStatus, 8000);
  }, []);

  const switchOn = (id) => () => {
    const newSystemSettings = {
      ...systemSettings,
      [id]: {
        underMaintanance: !systemSettings[id].underMaintanance,
      },
    };
    socket.emit("UPDATE_SYSTEM_SETTINGS", newSystemSettings);
  };

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap mb-2 align-items-center justify-content-between">
        <div className="mb-3 mr-3">
          <h6 className="fs-16 text-black font-w600 mb-0">System</h6>
          <span className="fs-14 text-black">
            Current System Health and Operation Data
          </span>
        </div>
        <div className="d-flex mb-3">
          <button
            type="button"
            class="btn btn-primary mb-3 mr-2"
            onClick={() => {}}
          >
            Clear
          </button>
        </div>
      </div>
      <div className="row">
        <div className="col-xl-4 col-xxl-4 col-lg-4 col-sm-6">
          <div className={`card`}>
            <div className="card-body">
              <div className="d-flex align-items-end">
                <div>
                  <p className="fs-14 text-black mb-1 bold">Server State</p>
                  <span className="fs-14 text-black font-w600">
                    {severIsAlive === true ? (
                      <span>
                        <span className="fs-14 font-w600 badge badge-success">
                          Running
                        </span>
                        <br />
                        {restartingDynos ? (
                          <small className="text-black-50">Restarting...</small>
                        ) : (
                          <small>
                            <br />
                            <a
                              className="text-blue mt-2"
                              onClick={restartDynos}
                            >
                              Restart
                            </a>
                          </small>
                        )}
                      </span>
                    ) : severIsAlive === false ? (
                      <span>
                        <span className="fs-14 font-w600 badge badge-danger mb-2">
                          Not Running
                        </span>
                        <br />
                        {restartingDynos ? (
                          <small className="text-black-50">Restarting...</small>
                        ) : (
                          <small>
                            <a
                              className="text-blue mt-2"
                              onClick={restartDynos}
                            >
                              Restart
                            </a>
                          </small>
                        )}
                      </span>
                    ) : (
                      <span className="fs-14 font-w600 badge badge-secondary">
                        Checking status...
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-xxl-4 col-lg-4 col-sm-6">
          <div className={`card`}>
            <div className="card-body">
              <div className="d-flex align-items-end">
                <div>
                  <p className="fs-14 text-black mb-1 bold">
                    Socket connection
                  </p>
                  {socket?.connected ? (
                    <span className="fs-14 font-w600 badge badge-success">
                      Connected
                    </span>
                  ) : (
                    <span className="fs-14 font-w600 badge badge-danger">
                      Disconnected
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-xxl-4 col-lg-4 col-sm-6">
          <div className={`card`}>
            <div className="card-body">
              <div className="d-flex align-items-end">
                <div>
                  <p className="fs-14 text-black mb-1 bold">
                    Database connection
                  </p>
                  {dbIsAlive ? (
                    <span className="fs-14 font-w600 badge badge-success">
                      Connected
                    </span>
                  ) : dbIsAlive === false ? (
                    <span className="fs-14 font-w600 badge badge-danger">
                      Disconnected
                    </span>
                  ) : (
                    <span className="fs-14 font-w600 badge badge-secondary">
                      Checking status...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-xxl-4 col-lg-4 col-sm-6">
          <div className={`card`}>
            <div className="card-body">
              <div className="d-flex align-items-end">
                <div>
                  <p className="fs-14 text-black mb-1 bold">
                    Heroku Dynos State
                  </p>
                  <span className="fs-14 text-black font-w600">
                    {dynoInfo?.state === "up" ? (
                      <span>
                        <span className="fs-14 font-w600 badge badge-success">
                          Running
                        </span>
                        <br />
                        <small className="text-black-50">
                          Running {numberOfDynos} Dynos
                        </small>
                        <br />
                        <small>
                          <a className="text-blue mt-2" onClick={restartDynos}>
                            Restart Dynos
                          </a>
                        </small>
                      </span>
                    ) : (
                      <span>
                        <span className="fs-14 font-w600 badge badge-danger mb-2">
                          {dynoInfo?.state}
                        </span>
                        <br />
                        <a className="text-blue mt-2" onClick={restartDynos}>
                          Restart Dynos
                        </a>
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-xxl-4 col-lg-4 col-sm-6">
          <div className={`card`}>
            <div className="card-body">
              <div className="d-flex align-items-end">
                <div>
                  <p className="fs-14 text-black mb-1 bold">Heroku Bill</p>
                  <span className="fs-34 text-black font-w600">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(currentBill)}
                  </span>
                  <br />
                  <span>
                    {take(4,remove(1,2,invoices))
                      .sort((a, b) => {
                        return moment(a.period_end).isBefore(moment(b.period_end))
                          ? 1
                          : -1;
                      })
                      .map((i) => (
                        <small className="text-black-50">
                          {" - "}
                          {moment(i.period_end, "YYYY-MM-DD").format(
                            "MMM DD"
                          )}:{" "}
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(i.total/100)}{" "}
                          <br />
                        </small>
                      ))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-xxl-4 col-lg-4 col-sm-6">
          <div className={`card`}>
            <div className="card-body">
              <div className="d-flex align-items-end">
                <div>
                  <p className="fs-14 text-black mb-1 bold">Maintenance</p>
                  <small>
                    <u>Client System</u>
                  </small>
                  <br />
                  <small>
                    Maintanance mode:{" "}
                    {systemSettings?.client?.underMaintanance ? (
                      <span className="fs-14 font-w600 badge badge-danger">
                        ON
                      </span>
                    ) : (
                      <span className="fs-14 font-w600 badge badge-success">
                        OFF
                      </span>
                    )}
                  </small>
                  <br />
                  <small>
                    <a className="text-primary" onClick={switchOn("client")}>
                      Switch{" "}
                      {systemSettings?.client?.underMaintanance ? "Off" : "On"}
                    </a>
                  </small>
                  <br />
                  <small>
                    <u>Admin System</u>
                  </small>
                  <br />
                  <small>
                    Maintanance mode:{" "}
                    {systemSettings?.admin?.underMaintanance ? (
                      <span className="fs-14 font-w600 badge badge-danger">
                        ON
                      </span>
                    ) : (
                      <span className="fs-14 font-w600 badge badge-success">
                        OFF
                      </span>
                    )}
                  </small>
                  <br />
                  <small>
                    <a className="text-primary" onClick={switchOn("admin")}>
                      Switch{" "}
                      {systemSettings?.admin?.underMaintanance ? "Off" : "On"}
                    </a>
                  </small>
                  <br />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Event</th>
              <th scope="col">Time</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr>
                <td>
                  <strong>{e?.name}</strong>
                </td>
                <td>{e?.time}</td>
                <td>{e?.args[0]?.id || e?.args[0]?.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Operations;
