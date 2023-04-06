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
import { keys, range, values } from "ramda";
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
  width: 45%;
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

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
    },
  };

  const labels = keys(analytics?.amountsMade);
  const financeData = {
    labels,
    datasets: [
      {
        label: "Amount Paid",
        data: values(analytics?.amountsMade),
        backgroundColor: "pink",
      },
    ],
  };

  const appointmentData = {
    labels,
    datasets: [
      {
        label: "Appointments",
        data: values(analytics?.appointments),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  const employeeData = {
    labels,
    datasets: [
      {
        label: "Employees Serviced",
        data: values(analytics?.employeesCateredTo),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  const servicesData = {
    labels,
    datasets: [
      {
        label: "Services Performed",
        data: values(analytics?.servicesPerformed),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
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
        <button
            type="button"
            class="btn btn-primary mb-3"
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
      {!loading && (
        <Wrapper>
          <ChartContainer>
            <div>
              {analytics && <Bar options={options} data={financeData} />}
            </div>
          </ChartContainer>
          <ChartContainer>
            <div>
              {analytics && <Bar options={options} data={appointmentData} />}
            </div>
          </ChartContainer>
          <ChartContainer>
            <div>
              {analytics && <Bar options={options} data={employeeData} />}
            </div>
          </ChartContainer>
          <ChartContainer>
            <div>
              {analytics && <Bar options={options} data={servicesData} />}
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
