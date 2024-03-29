import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { isEmpty, isNil, keys, mergeAll, range, values } from "ramda";
import moment from "moment";
import { Line } from "rc-progress";

import { BsPeopleFill } from "react-icons/bs";
import { GiReceiveMoney } from "react-icons/gi";
import { BiNotepad } from "react-icons/bi";
import { FaSyringe } from "react-icons/fa";
import { connect } from "react-redux";

const iconsByTitle = {
  money: GiReceiveMoney,
  employees: BsPeopleFill,
  pad: BiNotepad,
  syringe: FaSyringe,
};

const getIcon = (title) => {
  const Icon = iconsByTitle[title];
  return Icon ? <Icon /> : null;
};

const Wrapper = styled.div`
  width: 100%;
  height: 300px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    overflow-x: scroll;
    height:auto;
  }
`;

const ChartContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  @media (max-width: 768px) {
    overflow-x: scroll;
    width: 200vw;
    height: 400px;
  }
  div {
    height: 100%;
    width: 100%;
    @media (max-width: 768px) {
      overflow-x: scroll;
      width: 200vw;
      height: 400px;
    }
  }
`;
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const formatPrice = (price) => {
  return `R ${price.toFixed(2)}`;
};

const exists = i => !isEmpty(i) && !isNil(i);

const Analytics = ({ socket, user }) => {
  const [analytics, setAnalytics] = useState(null);
  const [originalAnalytics, setOriginalAnalytics] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(moment().format("MMMM"));
  const [selectedYear, setSelectedYear] = useState(moment().format("YYYY"));
  const [loading, setLoading] = useState(true);
  const [counter, setCounter] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const myInterval = useRef();

  useEffect(() => {
    return () => clearInterval(myInterval.current);
  }, []);

  useEffect(() => {
    if (isRunning && counter < 5) {
      myInterval.current = setInterval(
        () => setCounter((counter) => counter + 1),
        1000
      );
    } else {
      clearInterval(myInterval.current);
      myInterval.current = null;
    }
  }, [isRunning]);

  if (socket && !analytics && !isRunning && exists(user)) {
    setCounter(0);
    setIsRunning(true);

    socket.emit("GET_FINANCE_ANALYTICS", {
      date: `01-${selectedMonth}-${selectedYear}`,
      type: user?.details?.adminType === "xrayAdmin" ? "x-rays" : "all"
    });
    
    socket.on("RECEIVE_FINANCE_ANALYTICS", (data) => {
      console.log(data);
      setAnalytics(data);
      setOriginalAnalytics(data);
      setLoading(false);
      setCounter(0);
      setIsRunning(false);
    });
  }

  const clear = () => {
    setAnalytics(originalAnalytics);
  };

  const getAnalytics = () => {
    setCounter(0);
    setIsRunning(true);
    setLoading(true);
    socket.emit("GET_FINANCE_ANALYTICS", {
      date: `01-${selectedMonth}-${selectedYear}`,
    });
    socket.on("RECEIVE_FINANCE_ANALYTICS", (data) => {
      console.log(data);
      setAnalytics(data);
      setLoading(false);
      setCounter(0);
      setIsRunning(false);
    });
  };

  const amountOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Gross Appointment Pay",
      },
    },
  };

  const appOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Appointments",
      },
    },
  };

  const employeeOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Employees Serviced",
      },
    },
  };

  const serviceOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Services Rendered",
      },
    },
  };

  const companiesOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Companies Created vs New Users",
      },
    },
  };

  const labels = range(1, moment(selectedMonth, "MMMM").daysInMonth() + 1).map(
    (d) =>
      `${selectedYear}-${moment(selectedMonth, "MMMM").format(
        "MM"
      )}-${d.toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        useGrouping: false,
      })}`
  );
  const getValues = (data, type, location) => {
    const i = !isNil(data)
      ? values(mergeAll(labels.map((d) => ({ [d]: data[d] ?? 0 }))))
      : [];
    return i;
  };

  const financeData = {
    labels,
    datasets: [
      {
        label: "All Clinics",
        data: getValues(analytics?.allClinics?.amountsMade),
        backgroundColor: "lightslategrey",
      },
      {
        label: "Hendrina",
        data: getValues(analytics?.hendrina?.amountsMade),
        backgroundColor: "blue",
      },
      {
        label: "Churchill",
        data: getValues(analytics?.churchill?.amountsMade),
        backgroundColor: "lightgreen",
      },
    ],
  };

  const appointmentData = {
    labels,
    datasets: [
      {
        label: "All Clinics",
        data: getValues(analytics?.allClinics?.appointments),
        backgroundColor: "lightslategrey",
      },
      {
        label: "Hendrina",
        data: getValues(analytics?.hendrina?.appointments),
        backgroundColor: "blue",
      },
      {
        label: "Churchill",
        data: getValues(analytics?.churchill?.appointments),
        backgroundColor: "lightgreen",
      },
    ],
  };

  const employeeData = {
    labels,
    datasets: [
      {
        label: "All Clinics",
        data: getValues(analytics?.allClinics?.employeesCateredTo),
        backgroundColor: "lightslategrey",
      },
      {
        label: "Hendrina",
        data: getValues(analytics?.hendrina?.employeesCateredTo),
        backgroundColor: "blue",
      },
      {
        label: "Churchill",
        data: getValues(analytics?.churchill?.employeesCateredTo),
        backgroundColor: "lightgreen",
      },
    ],
  };

  const servicesData = {
    labels,
    datasets: [
      {
        label: "All Clinics",
        data: getValues(analytics?.allClinics?.servicesPerformed),
        backgroundColor: "lightslategrey",
      },
      {
        label: "Hendrina",
        data: getValues(analytics?.hendrina?.servicesPerformed),
        backgroundColor: "blue",
      },
      {
        label: "Churchill",
        data: getValues(analytics?.churchill?.servicesPerformed),
        backgroundColor: "lightgreen",
      },
    ],
  };

  const compsAndUsersData = {
    labels,
    datasets: [
      {
        label: "Companies Created",
        data: getValues(analytics?.companiesJoined),
        backgroundColor: "lightslategrey",
      },
      {
        label: "New Users",
        data: getValues(analytics?.usersJoined),
        backgroundColor: "blue",
      },
    ],
  };
  console.log("timeElapsed", counter);
  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap mb-2 align-items-center justify-content-between">
        <div className="mb-3 mr-3">
          <h6 className="fs-16 text-black font-w600 mb-0">Analytics</h6>
          <span className="fs-14 text-black">
            Listed below is monthly analytical information
          </span>
        </div>
        <div className="d-flex mb-3">
          <button
            type="button"
            class="btn btn-primary  mb-3 mr-2"
            onClick={getAnalytics}
          >
            Generate
          </button>
          <button
            type="button"
            class="btn btn-primary mb-3 mr-2"
            onClick={clear}
          >
            Clear
          </button>
          <select
            className="form-control style-2 default-select mr-3"
            onClick={(e) => {
              setSelectedMonth(e.target.value);
            }}
          >
            {range(1, 13).map((m) => {
              const month = moment(m, "MM").format("MMMM");
              return (
                <option value={month} selected={selectedMonth === month}>
                  {month}
                </option>
              );
            })}
          </select>
          <select
            className="form-control style-2 default-select mr-3"
            onClick={(e) => {
              setSelectedYear(e.target.value);
            }}
          >
            {range(2022, 2024).map((y) => {
              return (
                <option value={y} selected={selectedYear === y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div>
        <div>
          <h3 class="card-title">Summary</h3>
          <h6 class="card-subtitle mb-2 text-muted">
            This is how ClinicPlus performed for the month of {selectedMonth} in
            the year {selectedYear}
          </h6>
          <div className="row">
            {/* <div className="col-xl-3 col-xxl-3 col-lg-3 col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-end">
                    <div>
                      <p className="fs-14 text-black mb-1 bold">Net Pay</p>
                      <span className="fs-34 text-black font-w600">
                        {analytics &&
                          new Intl.NumberFormat("en-ZA", {
                            style: "currency",
                            currency: "ZAR",
                          }).format(
                            getValues(
                              analytics?.allClinics?.amountsMade
                            ).reduce((acc, curr) => curr + acc, 0)
                          )}
                      </span>
                      <p className="fs-14 mb-1 bold">
                        Hendrina :{" "}
                        <span className="fs-12 text-black font-w600">
                          {analytics &&
                            new Intl.NumberFormat("en-ZA", {
                              style: "currency",
                              currency: "ZAR",
                            }).format(
                              getValues(
                                analytics?.hendrina?.amountsMade
                              ).reduce((acc, curr) => curr + acc, 0)
                            )}
                        </span>
                      </p>
                      <p className="fs-14 mb-1 bold">
                        Churchill :{" "}
                        <span className="fs-12 text-black font-w600">
                          {analytics &&
                            new Intl.NumberFormat("en-ZA", {
                              style: "currency",
                              currency: "ZAR",
                            }).format(
                              getValues(
                                analytics?.churchill?.amountsMade
                              ).reduce((acc, curr) => curr + acc, 0)
                            )}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
            <div className="col-xl-3 col-xxl-3 col-lg-3 col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-end">
                    <div>
                      <p className="fs-14 text-black mb-1 bold">
                        Total Appointments
                      </p>
                      <span className="fs-35 text-black font-w600">
                        {analytics &&
                          getValues(analytics?.allClinics?.appointments).reduce(
                            (acc, curr) => curr + acc,
                            0
                          )}
                      </span>
                      <p className="fs-14 mb-1 bold">
                        Hendrina :{" "}
                        <span className="fs-12 text-black font-w600">
                          {analytics &&
                            getValues(analytics?.hendrina?.appointments).reduce(
                              (acc, curr) => curr + acc,
                              0
                            )}
                        </span>
                      </p>
                      <p className="fs-14 mb-1 bold">
                        Churchill :{" "}
                        <span className="fs-12 text-black font-w600">
                          {analytics &&
                            getValues(
                              analytics?.churchill?.appointments
                            ).reduce((acc, curr) => curr + acc, 0)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-xxl-3 col-lg-3 col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-end">
                    <div>
                      <p className="fs-14 text-black mb-1 bold">
                        Total Employees Serviced
                      </p>
                      <span className="fs-35 text-black font-w600">
                        {analytics &&
                          getValues(
                            analytics?.allClinics?.employeesCateredTo
                          ).reduce((acc, curr) => curr + acc, 0)}
                      </span>
                      <p className="fs-14  mb-1 bold">
                        Hendrina :{" "}
                        <span className="fs-12 text-black font-w600">
                          {analytics &&
                            getValues(
                              analytics?.hendrina?.employeesCateredTo
                            ).reduce((acc, curr) => curr + acc, 0)}
                        </span>
                      </p>
                      <p className="fs-14  mb-1 bold">
                        Churchill :{" "}
                        <span className="fs-12 text-black font-w600">
                          {analytics &&
                            getValues(
                              analytics?.churchill?.employeesCateredTo
                            ).reduce((acc, curr) => curr + acc, 0)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-xxl-3 col-lg-3 col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-end">
                    <div>
                      <p className="fs-14 text-black mb-1 bold">
                        Total Services Rendered
                      </p>
                      <span className="fs-35 text-black font-w600">
                        {analytics &&
                          getValues(
                            analytics?.allClinics?.servicesPerformed
                          ).reduce((acc, curr) => curr + acc, 0)}
                      </span>
                      <p className="fs-14  mb-1 bold">
                        Hendrina :{" "}
                        <span className="fs-12 text-black font-w600">
                          {analytics &&
                            getValues(
                              analytics?.hendrina?.servicesPerformed
                            ).reduce((acc, curr) => curr + acc, 0)}
                        </span>
                      </p>
                      <p className="fs-14  mb-1 bold">
                        Churchill :{" "}
                        <span className="fs-12 text-black font-w600">
                          {analytics &&
                            getValues(
                              analytics?.churchill?.servicesPerformed
                            ).reduce((acc, curr) => curr + acc, 0)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <h3 class="card-title">Breakdown</h3>

      {loading && (
        <div class="row">
          <div class="col-md-12 text-center">
            <h1> Generating analytical data, please wait ....</h1>
            <Line
              percent={(counter / 60) * 100}
              strokeWidth={2}
              strokeColor="#fe4128"
            />
          </div>
        </div>
      )}
      {!loading && (
        <Wrapper>
          <ChartContainer>
            <div>
              {analytics && <Bar options={amountOptions} data={financeData} />}
            </div>
          </ChartContainer>
          <ChartContainer>
            <hr />

            <div>
              {analytics && <Bar options={appOptions} data={appointmentData} />}
            </div>
          </ChartContainer>
          <ChartContainer>
            <hr />

            <div>
              {analytics && (
                <Bar options={employeeOptions} data={employeeData} />
              )}
            </div>
          </ChartContainer>
          <ChartContainer>
            <hr />

            <div>
              {analytics && (
                <Bar options={serviceOptions} data={servicesData} />
              )}
            </div>
          </ChartContainer>
          <ChartContainer>
            <div>
              {analytics && (
                <Bar options={companiesOptions} data={compsAndUsersData} />
              )}
            </div>
          </ChartContainer>
        </Wrapper>
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(Analytics);


