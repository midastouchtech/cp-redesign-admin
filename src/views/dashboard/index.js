import React, { useMemo } from "react";
import { FaClinicMedical, FaReply } from "react-icons/fa";
import { BsPersonCheckFill } from "react-icons/bs";
import { MdOutlinePendingActions } from "react-icons/md";
import { TbFileReport } from "react-icons/tb";
import { GoReport } from "react-icons/go";
import { BsPeopleFill } from "react-icons/bs";
import { isEmpty, isNil, reject } from "ramda";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  BarElement,
} from "chart.js";
import { Doughnut, Line as LineChart, Bar } from "react-chartjs-2";
import moment from "moment";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { useCachedFetch } from "../../hooks/useCachedFetch";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  BarElement
);

const COLORS = {
  primary: "#1E40AF",
  secondary: "#3B82F6",
  accent: "#D97706",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  muted: "#64748B",
  border: "#E2E8F0",
};

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
  .msg_cotainer {
    background: #fe634e;
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

const RefreshBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${COLORS.muted};
  margin-left: 12px;
  &::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${(props) => (props.$refreshing ? COLORS.accent : COLORS.success)};
    ${(props) => (props.$refreshing ? "animation: pulse 1s infinite;" : "")}
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
`;

const BacklogBar = styled.div`
  display: flex;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
  background: ${COLORS.border};
  margin: 12px 0;
`;

const BacklogSegment = styled.div`
  height: 100%;
  background: ${(props) => props.$color};
  width: ${(props) => props.$pct}%;
  transition: width 300ms ease;
`;

const BacklogLegend = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: ${COLORS.muted};
  span.dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
  }
`;

const ClinicRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid ${COLORS.border};
  &:last-child {
    border-bottom: none;
  }
`;

const CompanyRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid ${COLORS.border};
  &:last-child {
    border-bottom: none;
  }
`;

const RankBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${COLORS.muted}22;
  color: ${COLORS.muted};
  font-size: 12px;
  font-weight: 600;
  margin-right: 10px;
`;

const SkeletonBlock = styled.div`
  height: ${(props) => props.$height || "20px"};
  border-radius: 6px;
  background: linear-gradient(90deg, #eef1f5 25%, #f7f9fb 37%, #eef1f5 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  @keyframes shimmer {
    0% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0 50%;
    }
  }
`;

const getReadableTime = (date) => moment(date).format("DD/MM/YYYY");
const getTimeFromDate = (date) => moment(date).format("HH:MM");

const capitalize = (str) =>
  str
    ? str
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : str;

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

const exists = (i) => !isEmpty(i) && !isNil(i);

const getBadgeType = (title) => {
  if (title === "approved") return "badge-success";
  if (title === "pending") return "badge-warning";
  return "badge-danger";
};

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n || 0);

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

const Dashboard = ({ user }) => {
  const type = user?.details?.adminType === "xrayAdmin" ? "x-rays" : "all";
  const enabled = exists(user);

  const fetcher = useMemo(
    () => async () => {
      const res = await fetch(`${COMPANION_API_URL}/api/admin/dashboard-stats?type=${type}`, {
        headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET },
      });
      if (!res.ok) {
        throw new Error(`Failed to load dashboard stats (${res.status})`);
      }
      return res.json();
    },
    [type]
  );

  const { data, loading, refreshing, error, cachedAt } = useCachedFetch(
    `dashboard-stats:${type}`,
    fetcher,
    { enabled }
  );

  const [activeStat, setActiveStat] = React.useState("today");

  const stats = data?.stats;
  const latestAppointments = data?.latestAppointments;
  const latestMessages = data?.latestMessages;
  const insights = data?.insights;

  const selectedStats = stats ? reject((s) => s.title === "Top Services", stats[activeStat] || stats.today) : [];
  const topServices = stats ? (stats[activeStat] || stats.today).find((s) => s.title === "Top Services") : null;

  const getActiveClass = (stat) => (activeStat === stat ? "active" : "");

  const topServicesChartData = {
    labels: topServices?.count?.count?.map((service) => service.title) || [],
    datasets: [
      {
        label: "Services",
        data: topServices?.count?.count?.map((service) => service.count) || [],
        backgroundColor: [COLORS.primary, COLORS.secondary, COLORS.accent],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const getLegendColorByIndex = (index) => topServicesChartData.datasets[0].backgroundColor[index];

  const revenueTrendData = insights?.revenueTrend
    ? {
        labels: insights.revenueTrend.map((p) => moment(p.date).format("D MMM")),
        datasets: [
          {
            label: "Revenue",
            data: insights.revenueTrend.map((p) => p.amount),
            borderColor: COLORS.primary,
            backgroundColor: "rgba(30, 64, 175, 0.1)",
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      }
    : null;

  const revenueTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 6, font: { size: 10 } } },
      y: { grid: { color: COLORS.border }, ticks: { font: { size: 10 } } },
    },
  };

  const backlog = insights?.quoteBacklog;
  const backlogTotal = backlog ? backlog["0-3d"] + backlog["4-7d"] + backlog["8d+"] : 0;
  const backlogPct = (n) => (backlogTotal > 0 ? (n / backlogTotal) * 100 : 0);

  const statusBreakdown = insights?.statusBreakdown;
  const statusChartData = statusBreakdown
    ? {
        labels: ["Pending", "Approved", "Declined"],
        datasets: [
          {
            data: [statusBreakdown.pending, statusBreakdown.approved, statusBreakdown.declined],
            backgroundColor: [COLORS.warning, COLORS.success, COLORS.danger],
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      }
    : null;

  const clinicComparisonData = insights?.clinicComparison
    ? {
        labels: insights.clinicComparison.map((c) => c.clinic),
        datasets: [
          {
            label: "Appointments",
            data: insights.clinicComparison.map((c) => c.appointments),
            backgroundColor: COLORS.primary,
            borderRadius: 4,
          },
        ],
      }
    : null;

  const clinicComparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: COLORS.border }, ticks: { font: { size: 10 } } },
    },
  };

  return (
    <div className="container-fluid homedash">
      <div className="row">
        <div className="col-xl-12 col-xxl-12">
          <div className="d-flex align-items-center flex-wrap mb-3">
            <div className="event-tabs mr-3">
              <ul className="nav nav-tabs" role="tablist">
                {["today", "yesterday", "thisMonth", "lastMonth"].map((key) => (
                  <li className="nav-item" key={key}>
                    <a
                      className={`nav-link ${getActiveClass(key)}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setActiveStat(key)}
                    >
                      {{ today: "Today", yesterday: "Yesterday", thisMonth: "This month", lastMonth: "Last Month" }[key]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {stats && (
              <RefreshBadge $refreshing={refreshing} title={cachedAt ? moment(cachedAt).format("HH:mm:ss") : ""}>
                {refreshing ? "Refreshing…" : `Updated ${cachedAt ? moment(cachedAt).fromNow() : ""}`}
              </RefreshBadge>
            )}
          </div>

          {error && (
            <div className="row">
              <div className="col-12">
                <h4 className="text-danger">Failed to load dashboard stats: {error}</h4>
              </div>
            </div>
          )}

          <div className="row">
            {loading && !stats
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div className="col-xl-3 col-lg-3 col-sm-6" key={i}>
                    <div className="card">
                      <div className="card-body">
                        <SkeletonBlock $height="14px" style={{ width: "60%", marginBottom: 12 }} />
                        <SkeletonBlock $height="32px" style={{ width: "40%" }} />
                      </div>
                    </div>
                  </div>
                ))
              : selectedStats.map(({ title, count }) => (
                  <div className="col-xl-3 col-lg-3 col-sm-6" key={title}>
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex align-items-end">
                          <div>
                            <p className="fs-14 mb-1">{title}</p>
                            <span className="fs-35 text-black font-w600 icon-count">
                              {getIcon(title)}
                              {count.count}
                              <CaratContainer isUp={count.countDiferennce < 0}>
                                {count.countDiferennce < 0 ? (
                                  <svg className="ml-1" width="19" height="12" viewBox="0 0 19 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                      d="M2.00401 11.1924C0.222201 11.1924 -0.670134 9.0381 0.589795 7.77817L7.78218 0.585786C8.56323 -0.195262 9.82956 -0.195262 10.6106 0.585786L17.803 7.77817C19.0629 9.0381 18.1706 11.1924 16.3888 11.1924H2.00401Z"
                                      fill="#33C25B"
                                    />
                                  </svg>
                                ) : (
                                  <svg className="ml-1" width="19" height="12" viewBox="0 0 19 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                      d="M2.00401 11.1924C0.222201 11.1924 -0.670134 9.0381 0.589795 7.77817L7.78218 0.585786C8.56323 -0.195262 9.82956 -0.195262 10.6106 0.585786L17.803 7.77817C19.0629 9.0381 18.1706 11.1924 16.3888 11.1924H2.00401Z"
                                      fill="green"
                                    />
                                  </svg>
                                )}
                              </CaratContainer>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* --- Insights row: revenue trend, quote backlog urgency, clinic comparison, status breakdown --- */}
      <div className="row">
        <div className="col-xl-6 col-lg-6">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h4 className="fs-18">Revenue — last 30 days</h4>
            </div>
            <div className="card-body" style={{ height: 220 }}>
              {loading && !insights ? (
                <SkeletonBlock $height="180px" />
              ) : revenueTrendData ? (
                <LineChart data={revenueTrendData} options={revenueTrendOptions} />
              ) : (
                <p className="text-muted">No revenue data available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-sm-6">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h4 className="fs-18">Quote backlog</h4>
            </div>
            <div className="card-body">
              {loading && !insights ? (
                <SkeletonBlock $height="80px" />
              ) : backlog ? (
                <>
                  <span className="fs-35 text-black font-w600">{backlogTotal}</span>
                  <p className="fs-13 text-muted mb-2">appointments awaiting a quote</p>
                  <BacklogBar>
                    <BacklogSegment $color={COLORS.success} $pct={backlogPct(backlog["0-3d"])} />
                    <BacklogSegment $color={COLORS.warning} $pct={backlogPct(backlog["4-7d"])} />
                    <BacklogSegment $color={COLORS.danger} $pct={backlogPct(backlog["8d+"])} />
                  </BacklogBar>
                  <BacklogLegend>
                    <span>
                      <span className="dot" style={{ background: COLORS.success }} />
                      0-3d: {backlog["0-3d"]}
                    </span>
                    <span>
                      <span className="dot" style={{ background: COLORS.warning }} />
                      4-7d: {backlog["4-7d"]}
                    </span>
                    <span>
                      <span className="dot" style={{ background: COLORS.danger }} />
                      8d+: {backlog["8d+"]}
                    </span>
                  </BacklogLegend>
                </>
              ) : (
                <p className="text-muted">No backlog data available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-sm-6">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h4 className="fs-18">Status — this month</h4>
            </div>
            <div className="card-body" style={{ height: 200 }}>
              {loading && !insights ? (
                <SkeletonBlock $height="160px" />
              ) : statusChartData ? (
                <Doughnut
                  data={statusChartData}
                  options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } } }}
                />
              ) : (
                <p className="text-muted">No status data available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-6 col-lg-6">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h4 className="fs-18">Clinic comparison — this month</h4>
            </div>
            <div className="card-body">
              {loading && !insights ? (
                <SkeletonBlock $height="140px" />
              ) : insights?.clinicComparison?.length ? (
                <>
                  <div style={{ height: 140 }}>
                    <Bar data={clinicComparisonData} options={clinicComparisonOptions} />
                  </div>
                  {insights.clinicComparison.map((c) => (
                    <ClinicRow key={c.clinic}>
                      <span className="font-w600">{c.clinic}</span>
                      <span className="text-muted fs-13">
                        {c.appointments} appointments · {c.employeesCateredTo} employees · {formatCurrency(c.amount)}
                      </span>
                    </ClinicRow>
                  ))}
                </>
              ) : (
                <p className="text-muted">No clinic data available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-6 col-lg-6">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h4 className="fs-18">Top companies — this month</h4>
            </div>
            <div className="card-body">
              {loading && !insights ? (
                <SkeletonBlock $height="140px" />
              ) : insights?.topCompanies?.length ? (
                insights.topCompanies.map((c, i) => (
                  <CompanyRow key={c.name}>
                    <span>
                      <RankBadge>{i + 1}</RankBadge>
                      {c.name}
                    </span>
                    <span className="text-muted fs-13">
                      {c.appointments} appts · {formatCurrency(c.amount)}
                    </span>
                  </CompanyRow>
                ))
              ) : (
                <p className="text-muted">No company data available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {!loading && (
        <MegaCardContainer className="row">
          <div className="mega-card col-xl-3 col-xxl-3">
            <div className="row">
              <div className="col-xl-12 col-md-6">
                <div className="card">
                  <div className="card-header border-0 pb-0">
                    <h4 className="fs-20">Top Services</h4>
                  </div>
                  <div className="card-body">
                    <Doughnut data={topServicesChartData} />
                    <div className="d-flex justify-content-between mt-4">
                      {topServices?.count?.count?.map(({ title, count }, index) => (
                        <div className="pr-2" key={title}>
                          <svg width="20" height="8" viewBox="0 0 20 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="20" height="8" rx="4" fill={`${getLegendColorByIndex(index)}`} />
                          </svg>
                          <h4 className="fs-18 text-black mb-1 font-w600">{count}</h4>
                          <span className="fs-14">{title}</span>
                        </div>
                      ))}
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
                          <tr key={appointment.id}>
                            <td>{appointment?.details?.company?.name}</td>
                            <td>{appointment?.usersWhoCanManage ? appointment?.usersWhoCanManage[0].name : ""}</td>
                            <td>{appointment?.details?.date}</td>
                            <td>
                              <span className={`badge badge-pill ${getBadgeType(appointment?.status)}`}>{appointment?.status}</span>
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
                  <MessageBody className="media" key={`${message.appointment}-${message.createdAt}`}>
                    <div className="media-body">
                      <HeadContainer>
                        <h6 className="mt-0">{capitalize(message?.company)}</h6>
                        <p>{capitalize(message?.author?.name)}</p>
                      </HeadContainer>
                      <p className="msg_cotainer">
                        <small>{message?.message}</small>
                      </p>
                      <HeadContainer>
                        <small>
                          {getReadableTime(message.createdAt)} at {getTimeFromDate(message.createdAt)}
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

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(Dashboard);
