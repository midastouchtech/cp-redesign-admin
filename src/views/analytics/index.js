import React, { useState } from "react";
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
import { isNil, keys, mergeAll, range, values } from "ramda";
import moment from "moment";

const Wrapper = styled.div`
  width: 100%;
  height: 300px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const ChartContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  div{
    height: 100% ;
    width: 100% ;
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

const Analytics = ({ socket }) => {
  const [analytics, setAnalytics] = useState(null);
  const [originalAnalytics, setOriginalAnalytics] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(moment().format("MMMM"));
  const [selectedYear, setSelectedYear] = useState(moment().format("YYYY"));
  const [loading, setLoading] = useState(true);

  if (socket && !analytics) {
    socket.emit("GET_FINANCE_ANALYTICS", {
      date: `01-${selectedMonth}-${selectedYear}`,
    });
    socket.on("RECEIVE_FINANCE_ANALYTICS", (data) => {
      console.log(data);
      setAnalytics(data);
      setOriginalAnalytics(data);
      setLoading(false);
    });
  }

  const clear = () => {
    setAnalytics(originalAnalytics);
  };

  const getAnalytics = () => {
    setLoading(true);

    socket.emit("GET_FINANCE_ANALYTICS", {
      date: `01-${selectedMonth}-${selectedYear}`,
    });
    socket.on("RECEIVE_FINANCE_ANALYTICS", (data) => {
      console.log(data);
      setAnalytics(data);
      setLoading(false);
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

  const labels = range(1, moment(selectedMonth, "MMMM").daysInMonth()).map(
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

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap mb-2 align-items-center justify-content-between">
        <div className="mb-3 mr-3">
          <h6 className="fs-16 text-black font-w600 mb-0">Analytics</h6>
          <span className="fs-14">
            Listed below is monthly analytical information
          </span>
        </div>
        <div className="d-flex mb-3">
          <button
            type="button"
            class="btn btn-primary  mb-3"
            onClick={getAnalytics}
          >
            View
          </button>
          <button type="button" class="btn btn-primary mb-3" onClick={clear}>
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
      {!loading && (
        <Wrapper>
          <ChartContainer>
            <p>
              <strong>Net pay: </strong>
              {analytics &&
                formatPrice(
                  getValues(analytics?.allClinics?.amountsMade).reduce(
                    (acc, curr) => curr + acc,
                    0
                  )
                )}
            </p>
            <div>
              {analytics && <Bar options={amountOptions} data={financeData} />}
            </div>
          </ChartContainer>
          <ChartContainer>
            <hr />
            <p>
              <strong>Total Appointments: </strong>
              {analytics &&
                  getValues(analytics?.allClinics?.appointments).reduce(
                    (acc, curr) => curr + acc,
                    0
                  )
                }
            </p>
            <div>
              {analytics && <Bar options={appOptions} data={appointmentData} />}
            </div>
          </ChartContainer>
          <ChartContainer>
          <hr />
            <p>
              <strong>Total employees serviced: </strong>
              {analytics &&
                  getValues(analytics?.allClinics?.employeesCateredTo).reduce(
                    (acc, curr) => curr + acc,
                    0
                  )
                }
            </p>
            <div>
              {analytics && (
                <Bar options={employeeOptions} data={employeeData} />
              )}
            </div>
          </ChartContainer>
          <ChartContainer>
          <hr />
            <p>
              <strong>Total services rendered: </strong>
              {analytics &&
                  getValues(analytics?.allClinics?.servicesPerformed).reduce(
                    (acc, curr) => curr + acc,
                    0
                  )
                }
            </p>
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
      {loading && (
        <div class="row">
          <div class="col-md-12 text-center">
            <h1> Generating analytical data, please wait ....</h1>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
