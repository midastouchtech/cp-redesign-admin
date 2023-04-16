import React, { useEffect, useState, useRef } from "react";
import { FaClinicMedical, FaReply } from "react-icons/fa";
import { BsPersonCheckFill } from "react-icons/bs";
import { MdOutlinePendingActions } from "react-icons/md";
import { TbFileReport } from "react-icons/tb";
import { GoReport } from "react-icons/go";
import { BsPeopleFill } from "react-icons/bs";
import { HiMail } from "react-icons/hi";
import { reject } from "ramda";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import moment from "moment";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Line } from "rc-progress";


const CaratContainer = styled.div`
  ${(props) =>
    props.isUp
      ? `
      
      transform: scaleY(-1);
      svg{
        path{
          fill orange;
        }
      }
  
  `
      : ""}
`;

const MessageBody = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #cacaca;
  margin-bottom: 15px;
  padding-bottom: 5px;
  svg {
    margin-right: 10px;
  }
  button {
    margin-left: 10px;
  }
  .msg_cotainer{
    background: #FE634E;
    margin-left: 10px;
    border-radius: 0 1.25rem 1.25rem 1.25rem;
    padding: 10px 15px;
    color: #fff;
    position: relative;
  }
`;

const MegaCardContainer = styled.div`
  .mega-card {
    height: 500px;
    .card {
      height: 500px;
      overflow-y: scroll;
    }
  }
`;

const HeadContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  h6,
  p {
    padding: 0;
    margin: 0;
  }
`;

const LoadContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
`

const getReadableTime = (date) => {
  return moment(date).format("DD/MM/YYYY");
};

const getTimeFromDate = (date) => {
  return moment(date).format("HH:MM");
};

const capitalize = (str) =>
  str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const truncate = (str, n) => {
  return str?.length > n ? str.substr(0, n - 1) + "..." : str;
};

const iconsByTitle = {
  Hendrina: FaClinicMedical,
  Churchill: FaClinicMedical,
  Upcoming: BsPersonCheckFill,
  Pending: MdOutlinePendingActions,
  "Quotes Sent": MdOutlinePendingActions,
  "Quotes Pending": TbFileReport,
  Messages: GoReport,
  Employees: BsPeopleFill,
};

const getIcon = (title) => {
  const Icon = iconsByTitle[title];
  return Icon ? <Icon /> : null;
};

const getHowManyDaysAgo = (date) => {
  const today = moment();
  const dateToCompare = moment(date);
  const daysAgo = today.diff(dateToCompare, "days");
  return daysAgo;
};

const Dashboard = ({ socket }) => {
  const [stats, setStats] = useState(null);
  const [selectedStats, setSelectedStats] = useState([]);
  const [activeStat, setActiveStat] = useState([]);
  const [topServices, setTopServices] = useState({ count: [] });
  const [latestAppointments, setLatestAppointments] = useState(null);
  const [latestMessages, setLatestMessages] = useState(null);
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
 
  useEffect(()=>{
    console.log("use effect socket", socket)
    if (socket && !stats && !latestAppointments && !latestMessages && !isRunning) {
      setCounter(0);
      setIsRunning(true);
      socket.emit("GET_STATS");
      socket.on("RECEIVE_STATS", (stats) => {
        setStats(stats);
        setSelectedStats(
          reject((stat) => stat.title === "Top Services", stats.today)
        );
        setActiveStat("today");
        setTopServices(stats.today.find((stat) => stat.title === "Top Services"));
        setLoading(false);
        setCounter(0);
        setIsRunning(false);
      });
      socket.on("RECEIVE_LATEST_APPOINTMENTS", (appointments) => {
        setLatestAppointments(appointments);
      });
      socket.on("RECEIVE_LATEST_MESSAGES", (messages) => {
        setLatestMessages(messages);
      });
      socket.on("DATABASE_UPDATED", (u) => {
        //console.log("database updated we are now going to update the stats")
        socket.emit("GET_STATS");
       });
    }
  
  }, [socket]);

  
  const toggleStat = (stat) => {
    setSelectedStats(
      reject((stat) => stat.title === "Top Services", stats[stat])
    );
    setTopServices(stats[stat].find((stat) => stat.title === "Top Services"));
    setActiveStat(stat);
  };
  const getActiveClass = (stat) => {
    if (activeStat === stat) {
      return "active";
    }
    return "";
  };

  ChartJS.register(ArcElement, Tooltip);
  const data = {
    labels: topServices?.count?.count?.map((service) => service.title),
    datasets: [
      {
        label: "Services",
        data: topServices?.count?.count?.map((service) => service.count),
        backgroundColor: ["red", "blue", "yellow"],
        borderColor: ["red", "blue", "yellow"],
        borderWidth: 1,
      },
    ],
  };

  const getLegendColorByIndex = (index) => {
    return data.datasets[0].backgroundColor[index];
  };

  const getBadgeType = (title) => {
    if (title === "approved") {
      return "badge-success";
    }
    if (title === "pending") {
      return "badge-warning";
    } else {
      return "badge-danger";
    }
  };

  //console.log("latest messages", latestMessages);
  return (
    <div className="container-fluid homedash">
      <div className="row">
        <div className="col-xl-12 col-xxl-12">
          <div className="event-tabs mb-3 mr-3">
            <ul className="nav nav-tabs" role="tablist">
              <li className="nav-item">
                <a
                  className={`nav-link ${getActiveClass("today")}`}
                  onClick={() => toggleStat("today")}
                >
                  Today
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${getActiveClass("yesterday")}`}
                  onClick={() => toggleStat("yesterday")}
                >
                  Yesterday
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${getActiveClass("thisMonth")}`}
                  onClick={() => toggleStat("thisMonth")}
                >
                  This month
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${getActiveClass("lastMonth")}`}
                  onClick={() => toggleStat("lastMonth")}
                >
                  Last Month
                </a>
              </li>
            </ul>
          </div>
          <div className="row">
            {selectedStats.map(({ title, count }) => (
              <div className="col-xl-3 col-xxl-3 col-lg-3 col-sm-6">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex align-items-end">
                      <div>
                        <p className="fs-14 mb-1">{title}</p>
                        <span className="fs-35 text-black font-w600 icon-count">
                          {getIcon(title)}
                          {count.count}
                          <CaratContainer isUp={count.countDiferennce < 0}>
                            {count.countDiferennce < 0 ? 
                              (<svg
                                className="ml-1"
                                width="19"
                                height="12"
                                viewBox="0 0 19 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M2.00401 11.1924C0.222201 11.1924 -0.670134 9.0381 0.589795 7.77817L7.78218 0.585786C8.56323 -0.195262 9.82956 -0.195262 10.6106 0.585786L17.803 7.77817C19.0629 9.0381 18.1706 11.1924 16.3888 11.1924H2.00401Z"
                                  fill="#33C25B"
                                />
                              </svg>)
                            : (<svg
                              className="ml-1"
                              width="19"
                              height="12"
                              viewBox="0 0 19 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M2.00401 11.1924C0.222201 11.1924 -0.670134 9.0381 0.589795 7.77817L7.78218 0.585786C8.56323 -0.195262 9.82956 -0.195262 10.6106 0.585786L17.803 7.77817C19.0629 9.0381 18.1706 11.1924 16.3888 11.1924H2.00401Z"
                                fill="green"
                              />
                            </svg>)
                            }
                          </CaratContainer>
                        </span>
                      </div>
                      <canvas
                        className="lineChart"
                        id="chart_widget_2"
                        height="85"
                      ></canvas>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {loading && (
        <LoadContainer>
          <div class="row text-center">
          <div class="col-md-10 text-center">
            <h3> Generating report data, please wait ....</h3>
            <Line
              percent={(counter / 60) * 100}
              strokeWidth={2}
              strokeColor="#fe4128"
            />
          </div>
        </div>
        </LoadContainer>
      )}
      {!loading && (
        <MegaCardContainer className="row">
        <div className="mega-card col-xl-3 col-xxl-3">
          <div class="row">
            <div class="col-xl-12 col-md-6">
              <div class="card">
                <div class="card-header border-0 pb-0">
                  <h4 class="fs-20">Top Services</h4>
                </div>
                <div class="card-body">
                  <Doughnut data={data} />;
                  <div class="d-flex justify-content-between mt-4">
                    {topServices.count?.count?.map(
                      ({ title, count }, index) => (
                        <div class="pr-2">
                          <svg
                            width="20"
                            height="8"
                            viewBox="0 0 20 8"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              width="20"
                              height="8"
                              rx="4"
                              fill={`${getLegendColorByIndex(index)}`}
                            />
                          </svg>
                          <h4 class="fs-18 text-black mb-1 font-w600">
                            {count}
                          </h4>
                          <span class="fs-14">{title}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mega-card col-xl-5 col-xxl-5">
          <div className="card">
            <div className="card-body">
              <h4 className="fs-20">Latest Appointments</h4>
              <div className="table-responsive">
                <table className="table table-borderless mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Company Name</th>
                      <th scope="col">User Name</th>
                      <th scope="col">Date</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestAppointments &&
                      latestAppointments.map((appointment) => (
                        <tr>
                          <td>{appointment?.details?.company?.name}</td>
                          <td>{appointment?.usersWhoCanManage ? appointment?.usersWhoCanManage[0].name : ""}</td>
                          <td>{appointment?.details?.date}</td>
                          <td>
                            <span className={`badge badge-pill ${getBadgeType(appointment?.status)}`}>
                            {appointment?.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="mega-card col-xl-4 col-xxl-4">
          <div className="card">
            <div className="card-body">
              <h4 className="fs-20">Latest Messages</h4>
              {latestMessages?.map((message) => (
                <MessageBody className="media ">
                  <div className="media-body">
                    <HeadContainer>
                      <h6 className="mt-0">{capitalize(message?.company)}</h6>
                      <p>{capitalize(message?.author?.name)}</p>
                    </HeadContainer>
                    <p className="msg_cotainer"><small>{message?.message}</small></p>
                    <HeadContainer>
                      <small>
                        {getReadableTime(message.createdAt)} at{" "}
                        {getTimeFromDate(message.createdAt)}
                      </small>
                      <Link to={`appointment/${message.appointment}`} className="btn">
                        <FaReply size=".8rem" color="orange" />
                        <small>reply</small>
                      </Link>
                    </HeadContainer>
                  </div>
                </MessageBody>
              ))}
            </div>
          </div>
        </div>
      </MegaCardContainer>
      )}
      
    </div>
  );
};

export default Dashboard;
