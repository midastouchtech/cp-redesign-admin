
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

const ChartContainer = styled.div`
  width: 100%;
  height: 800px;
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

  if (socket && !analytics) {
    socket.emit("GET_FINANCE_ANALYTICS");
    socket.on("RECEIVE_FINANCE_ANALYTICS", (data) => {
      console.log(data);
      setAnalytics(data);
    });
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Sales",
      },
    },
  };

  const labels = analytics?.map((a) => a.date);
  const data = {
    labels,
    datasets: [
      {
        label: "Funds Received for month",
        data: analytics?.map((a) => a.amountMade),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
      {
        label: 'Appointments',
        data: analytics?.map((a) => a.count),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
    
  };

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap mb-2 align-items-center justify-content-between">
        <div className="mb-3 mr-3">
          <h6 className="fs-16 text-black font-w600 mb-0">Finance reports</h6>
          <span className="fs-14">
            Listed below is information for each employee
          </span>
        </div>
      </div>
      <ChartContainer>
        <div>{analytics && <Bar options={options} data={data} />}</div>
      </ChartContainer>
    </div>
  );
};

export default Analytics;
