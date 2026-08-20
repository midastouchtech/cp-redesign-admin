import React, { useMemo, useState } from "react";
import { FaReply } from "react-icons/fa";
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
import styled, { createGlobalStyle, keyframes } from "styled-components";
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

/* ---------------------------------------------------------------------- */
/* Design tokens — Medical Clean palette (Figtree headings / Noto Sans    */
/* body), scoped to this page only via GlobalStyle + styled-components.   */
/* ---------------------------------------------------------------------- */

const token = {
  ink900: "#0F172A",
  ink700: "#334155",
  ink500: "#64748B",
  ink300: "#94A3B8",
  line: "#E6EAF0",
  lineSoft: "#EFF2F6",
  surface: "#FFFFFF",
  canvas: "#F5F7FA",
  primary: "#1E40AF",
  primarySoft: "#EAF0FE",
  secondary: "#0891B2",
  secondarySoft: "#E3F6FA",
  success: "#15803D",
  successSoft: "#E7F6EC",
  warning: "#B45309",
  warningSoft: "#FDF1E0",
  danger: "#B91C1C",
  dangerSoft: "#FBE9E9",
  radius: "14px",
  radiusSm: "10px",
  shadow: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.10)",
};

const FontImport = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700;800&family=Noto+Sans:wght@400;500;600;700&display=swap');
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

/* ---------------------------------------------------------------------- */
/* Layout primitives                                                      */
/* ---------------------------------------------------------------------- */

const Page = styled.div`
  font-family: "Noto Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  color: ${token.ink900};
  padding: 28px clamp(16px, 3vw, 32px) 48px;
  max-width: 1600px;
  margin: 0 auto;

  h1, h2, h3, h4, h5 {
    font-family: "Figtree", "Noto Sans", sans-serif;
    color: ${token.ink900};
    letter-spacing: -0.01em;
  }

  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; }
  }
`;

const TopBar = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
`;

const Eyebrow = styled.p`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${token.primary};
  margin: 0 0 4px;
`;

const PageTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  margin: 0;
`;

const PageSub = styled.p`
  font-size: 14px;
  color: ${token.ink500};
  margin: 4px 0 0;
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: ${token.ink500};
  background: ${token.surface};
  border: 1px solid ${token.line};
  padding: 7px 12px;
  border-radius: 999px;
  &::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${(p) => (p.$refreshing ? token.warning : token.success)};
    ${(p) => (p.$refreshing ? "animation: pulse 1.1s ease-in-out infinite;" : "")}
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.25; }
  }
`;

const RangeTabs = styled.div`
  display: inline-flex;
  background: ${token.canvas};
  border: 1px solid ${token.line};
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
`;

const RangeTab = styled.button`
  appearance: none;
  border: none;
  background: ${(p) => (p.$active ? token.surface : "transparent")};
  color: ${(p) => (p.$active ? token.ink900 : token.ink500)};
  box-shadow: ${(p) => (p.$active ? "0 1px 3px rgba(15,23,42,0.10)" : "none")};
  font-size: 13px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: color 150ms ease, background 150ms ease;
  &:hover {
    color: ${token.ink900};
  }
  &:focus-visible {
    outline: 2px solid ${token.primary};
    outline-offset: 2px;
  }
`;

const ErrorBanner = styled.div`
  background: ${token.dangerSoft};
  border: 1px solid #f3c9c9;
  color: ${token.danger};
  border-radius: ${token.radiusSm};
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 20px;
`;

/* KPI hero row -------------------------------------------------------- */

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const KpiCard = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  padding: 18px 20px;
  box-shadow: ${token.shadow};
  animation: ${fadeIn} 300ms ease both;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const KpiTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const KpiLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${token.ink500};
`;

const KpiIconWrap = styled.span`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => p.$bg || token.primarySoft};
  color: ${(p) => p.$fg || token.primary};
  flex-shrink: 0;
`;

const KpiValueRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const KpiValue = styled.span`
  font-family: "Figtree", sans-serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
`;

const KpiDelta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 700;
  color: ${(p) => (p.$positive ? token.success : token.danger)};
`;

/* Generic section shell ------------------------------------------------ */

const Section = styled.div`
  display: grid;
  grid-template-columns: ${(p) => p.$cols || "1fr"};
  gap: 16px;
  margin-bottom: 16px;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  padding: 20px 22px;
  animation: ${fadeIn} 300ms ease both;
  display: flex;
  flex-direction: column;
`;

const PanelHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
`;

const PanelTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  margin: 0;
`;

const PanelMeta = styled.span`
  font-size: 12px;
  color: ${token.ink500};
  font-weight: 500;
`;

const Empty = styled.p`
  font-size: 13px;
  color: ${token.ink500};
  padding: 24px 0;
  text-align: center;
`;

const Skeleton = styled.div`
  border-radius: 8px;
  height: ${(p) => p.$h || "20px"};
  width: ${(p) => p.$w || "100%"};
  background: linear-gradient(90deg, ${token.lineSoft} 25%, #f9fafc 37%, ${token.lineSoft} 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  @keyframes shimmer {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
  }
`;

/* Backlog urgency widget ------------------------------------------------ */

const BacklogHeadline = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
`;

const BacklogNumber = styled.span`
  font-family: "Figtree", sans-serif;
  font-size: 32px;
  font-weight: 700;
`;

const BacklogBar = styled.div`
  display: flex;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: ${token.lineSoft};
  margin: 14px 0 12px;
`;

const BacklogSegment = styled.div`
  height: 100%;
  background: ${(p) => p.$color};
  width: ${(p) => p.$pct}%;
  transition: width 400ms ease;
`;

const BacklogLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BacklogLegendRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: ${token.ink700};
`;

const Dot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  margin-right: 8px;
`;

/* Rows: clinic comparison, top companies -------------------------------- */

const CompareRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid ${token.lineSoft};
  &:last-child { border-bottom: none; }
`;

const ClinicBadge = styled.span`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$fg};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: "Figtree", sans-serif;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
`;

const CompareBarTrack = styled.div`
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: ${token.lineSoft};
  overflow: hidden;
`;

const CompareBarFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: ${(p) => p.$color};
  width: ${(p) => p.$pct}%;
  transition: width 400ms ease;
`;

/* Latest appointments / messages ---------------------------------------- */

const TableScroll = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 380px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;

  thead th {
    text-align: left;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${token.ink500};
    padding: 0 8px 8px 0;
    border-bottom: 1px solid ${token.line};
  }
  thead th:nth-child(1) { width: 34%; }
  thead th:nth-child(2) { width: 26%; }
  thead th:nth-child(3) { width: 20%; }
  thead th:nth-child(4) { width: 20%; }

  tbody td {
    padding: 8px 8px 8px 0;
    border-bottom: 1px solid ${token.lineSoft};
    color: ${token.ink700};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: ${token.canvas}; }
`;

const StatusBadge = styled.span`
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  text-transform: capitalize;
  background: ${(p) =>
    p.$status === "approved" ? token.successSoft : p.$status === "pending" ? token.warningSoft : token.dangerSoft};
  color: ${(p) => (p.$status === "approved" ? token.success : p.$status === "pending" ? token.warning : token.danger)};
`;

const ScrollPanel = styled(Panel)`
  max-height: 340px;
  overflow-y: auto;
`;

const MessageItem = styled.div`
  padding: 9px 0;
  border-bottom: 1px solid ${token.lineSoft};
  &:last-child { border-bottom: none; }
`;

const MessageHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;

  strong {
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  span {
    font-size: 11px;
    color: ${token.ink500};
    flex-shrink: 0;
  }
`;

const MessageBubble = styled.p`
  background: ${token.canvas};
  border-radius: 0 8px 8px 8px;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.4;
  color: ${token.ink700};
  margin: 4px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MessageFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  color: ${token.ink500};
`;

const ReplyLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: ${token.primary};
  font-weight: 600;
  font-size: 10px;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

/* ---------------------------------------------------------------------- */

const capitalize = (str) =>
  str
    ? str
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : str;

const exists = (i) => !isEmpty(i) && !isNil(i);

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n || 0);

const KPI_META = {
  Employees: { bg: token.primarySoft, fg: token.primary },
  Messages: { bg: token.secondarySoft, fg: token.secondary },
  Pending: { bg: token.warningSoft, fg: token.warning },
  Upcoming: { bg: token.successSoft, fg: token.success },
  "Quotes Sent": { bg: token.secondarySoft, fg: token.secondary },
  "Quotes Pending": { bg: token.warningSoft, fg: token.warning },
  Hendrina: { bg: token.primarySoft, fg: token.primary },
  Churchill: { bg: token.dangerSoft, fg: token.danger },
};

const CLINIC_COLORS = { Hendrina: token.primary, Churchill: token.danger };

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

const RANGE_LABELS = { today: "Today", yesterday: "Yesterday", thisMonth: "This month", lastMonth: "Last month" };

const Dashboard = ({ user }) => {
  const type = user?.details?.adminType === "xrayAdmin" ? "x-rays" : "all";
  const enabled = exists(user);

  const fetcher = useMemo(
    () => async () => {
      const res = await fetch(`${COMPANION_API_URL}/api/admin/dashboard-stats?type=${type}`, {
        headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET },
      });
      if (!res.ok) throw new Error(`Failed to load dashboard stats (${res.status})`);
      return res.json();
    },
    [type]
  );

  const { data, loading, refreshing, error, cachedAt } = useCachedFetch(`dashboard-stats:${type}`, fetcher, {
    enabled,
  });

  const [activeRange, setActiveRange] = useState("today");

  const stats = data?.stats;
  const latestAppointments = data?.latestAppointments;
  const latestMessages = data?.latestMessages;
  const insights = data?.insights;

  const activeList = stats ? stats[activeRange] || stats.today : [];
  const kpis = reject((s) => s.title === "Top Services", activeList);
  const topServices = activeList.find((s) => s.title === "Top Services");

  const topServicesChartData = {
    labels: topServices?.count?.count?.map((s) => s.title) || [],
    datasets: [
      {
        data: topServices?.count?.count?.map((s) => s.count) || [],
        backgroundColor: [token.primary, token.secondary, token.warning],
        borderColor: token.surface,
        borderWidth: 3,
        hoverOffset: 4,
      },
    ],
  };

  const revenueTrendData = insights?.revenueTrend
    ? {
        labels: insights.revenueTrend.map((p) => moment(p.date).format("D MMM")),
        datasets: [
          {
            data: insights.revenueTrend.map((p) => p.amount),
            borderColor: token.primary,
            backgroundColor: "rgba(30, 64, 175, 0.08)",
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: token.primary,
            borderWidth: 2,
          },
        ],
      }
    : null;

  const revenueTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: token.ink900,
        padding: 10,
        titleFont: { size: 12 },
        bodyFont: { size: 12, weight: "600" },
        callbacks: { label: (ctx) => formatCurrency(ctx.parsed.y) },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 7, font: { size: 10 }, color: token.ink500 } },
      y: {
        grid: { color: token.lineSoft },
        border: { display: false },
        ticks: { font: { size: 10 }, color: token.ink500, callback: (v) => formatCurrency(v) },
      },
    },
  };

  const backlog = insights?.quoteBacklog;
  const backlogTotal = backlog ? backlog["0-3d"] + backlog["4-7d"] + backlog["8d+"] : 0;
  const backlogPct = (n) => (backlogTotal > 0 ? (n / backlogTotal) * 100 : 0);

  const statusBreakdown = insights?.statusBreakdown;
  const statusTotal = statusBreakdown
    ? statusBreakdown.pending + statusBreakdown.approved + statusBreakdown.declined
    : 0;
  const statusChartData = statusBreakdown
    ? {
        labels: ["Pending", "Approved", "Declined"],
        datasets: [
          {
            data: [statusBreakdown.pending, statusBreakdown.approved, statusBreakdown.declined],
            backgroundColor: [token.warning, token.success, token.danger],
            borderColor: token.surface,
            borderWidth: 3,
          },
        ],
      }
    : null;

  const maxClinicAppointments = insights?.clinicComparison?.length
    ? Math.max(...insights.clinicComparison.map((c) => c.appointments), 1)
    : 1;

  const topCompaniesChartData = insights?.topCompanies?.length
    ? {
        labels: insights.topCompanies.map((c) => c.name),
        datasets: [
          {
            data: insights.topCompanies.map((c) => c.appointments),
            backgroundColor: token.primary,
            borderRadius: 6,
            barThickness: 16,
          },
        ],
      }
    : null;

  const topCompaniesChartOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: token.lineSoft }, border: { display: false }, ticks: { font: { size: 10 }, color: token.ink500 } },
      y: { grid: { display: false }, ticks: { font: { size: 11 }, color: token.ink700 } },
    },
  };

  return (
    <Page>
      <FontImport />

      <TopBar>
        <div>
          <Eyebrow>Overview</Eyebrow>
          <PageTitle>Dashboard</PageTitle>
          <PageSub>Live operational snapshot across all clinics</PageSub>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <RangeTabs>
            {Object.keys(RANGE_LABELS).map((key) => (
              <RangeTab key={key} $active={activeRange === key} onClick={() => setActiveRange(key)}>
                {RANGE_LABELS[key]}
              </RangeTab>
            ))}
          </RangeTabs>
          {stats && (
            <StatusPill $refreshing={refreshing}>
              {refreshing ? "Refreshing" : cachedAt ? `Updated ${moment(cachedAt).fromNow()}` : "Live"}
            </StatusPill>
          )}
        </div>
      </TopBar>

      {error && <ErrorBanner>Failed to load dashboard stats: {error}</ErrorBanner>}

      {/* KPI hero row */}
      <KpiGrid>
        {loading && !stats
          ? Array.from({ length: 8 }).map((_, i) => (
              <KpiCard key={i}>
                <Skeleton $h="12px" $w="50%" />
                <Skeleton $h="30px" $w="40%" />
              </KpiCard>
            ))
          : kpis.map(({ title, count }) => {
              const meta = KPI_META[title] || { bg: token.primarySoft, fg: token.primary };
              const positive = count.countDiferennce >= 0;
              return (
                <KpiCard key={title}>
                  <KpiTop>
                    <KpiLabel>{title}</KpiLabel>
                    <KpiIconWrap $bg={meta.bg} $fg={meta.fg}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    </KpiIconWrap>
                  </KpiTop>
                  <KpiValueRow>
                    <KpiValue>{count.count}</KpiValue>
                    <KpiDelta $positive={positive}>
                      {positive ? "▲" : "▼"} {Math.abs(count.countDiferennce)}
                    </KpiDelta>
                  </KpiValueRow>
                </KpiCard>
              );
            })}
      </KpiGrid>

      {/* Trend + urgent backlog + status */}
      <Section $cols="1.6fr 1fr 1fr">
        <Panel>
          <PanelHead>
            <PanelTitle>Revenue — last 30 days</PanelTitle>
            {insights?.revenueTrend && (
              <PanelMeta>
                {formatCurrency(insights.revenueTrend.reduce((a, p) => a + p.amount, 0))} total
              </PanelMeta>
            )}
          </PanelHead>
          <div style={{ height: 230 }}>
            {loading && !insights ? (
              <Skeleton $h="100%" />
            ) : revenueTrendData ? (
              <LineChart data={revenueTrendData} options={revenueTrendOptions} />
            ) : (
              <Empty>No revenue data available.</Empty>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHead>
            <PanelTitle>Quote backlog</PanelTitle>
          </PanelHead>
          {loading && !insights ? (
            <Skeleton $h="120px" />
          ) : backlog ? (
            <>
              <BacklogHeadline>
                <BacklogNumber>{backlogTotal}</BacklogNumber>
                <PanelMeta>awaiting a quote</PanelMeta>
              </BacklogHeadline>
              <BacklogBar>
                <BacklogSegment $color={token.success} $pct={backlogPct(backlog["0-3d"])} />
                <BacklogSegment $color={token.warning} $pct={backlogPct(backlog["4-7d"])} />
                <BacklogSegment $color={token.danger} $pct={backlogPct(backlog["8d+"])} />
              </BacklogBar>
              <BacklogLegend>
                <BacklogLegendRow>
                  <span><Dot $color={token.success} />0–3 days</span>
                  <strong>{backlog["0-3d"]}</strong>
                </BacklogLegendRow>
                <BacklogLegendRow>
                  <span><Dot $color={token.warning} />4–7 days</span>
                  <strong>{backlog["4-7d"]}</strong>
                </BacklogLegendRow>
                <BacklogLegendRow>
                  <span><Dot $color={token.danger} />8+ days</span>
                  <strong>{backlog["8d+"]}</strong>
                </BacklogLegendRow>
              </BacklogLegend>
            </>
          ) : (
            <Empty>No backlog data available.</Empty>
          )}
        </Panel>

        <Panel>
          <PanelHead>
            <PanelTitle>Status — this month</PanelTitle>
          </PanelHead>
          <div style={{ height: 150, position: "relative" }}>
            {loading && !insights ? (
              <Skeleton $h="100%" />
            ) : statusChartData ? (
              <Doughnut
                data={statusChartData}
                options={{
                  maintainAspectRatio: false,
                  cutout: "68%",
                  plugins: { legend: { display: false } },
                }}
              />
            ) : (
              <Empty>No status data available.</Empty>
            )}
          </div>
          {statusBreakdown && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["Pending", statusBreakdown.pending, token.warning],
                ["Approved", statusBreakdown.approved, token.success],
                ["Declined", statusBreakdown.declined, token.danger],
              ].map(([label, val, color]) => (
                <BacklogLegendRow key={label}>
                  <span><Dot $color={color} />{label}</span>
                  <strong>
                    {val} {statusTotal > 0 && <PanelMeta>({Math.round((val / statusTotal) * 100)}%)</PanelMeta>}
                  </strong>
                </BacklogLegendRow>
              ))}
            </div>
          )}
        </Panel>
      </Section>

      {/* Clinic comparison + top companies */}
      <Section $cols="1fr 1fr">
        <Panel>
          <PanelHead>
            <PanelTitle>Clinic comparison — this month</PanelTitle>
          </PanelHead>
          {loading && !insights ? (
            <Skeleton $h="140px" />
          ) : insights?.clinicComparison?.length ? (
            insights.clinicComparison.map((c) => (
              <CompareRow key={c.clinic}>
                <ClinicBadge $bg={`${CLINIC_COLORS[c.clinic] || token.primary}18`} $fg={CLINIC_COLORS[c.clinic] || token.primary}>
                  {c.clinic.slice(0, 2).toUpperCase()}
                </ClinicBadge>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <strong style={{ fontSize: 13 }}>{c.clinic}</strong>
                    <span style={{ fontSize: 12, color: token.ink500 }}>
                      {c.appointments} appts · {c.employeesCateredTo} employees · {formatCurrency(c.amount)}
                    </span>
                  </div>
                  <CompareBarTrack>
                    <CompareBarFill
                      $color={CLINIC_COLORS[c.clinic] || token.primary}
                      $pct={(c.appointments / maxClinicAppointments) * 100}
                    />
                  </CompareBarTrack>
                </div>
              </CompareRow>
            ))
          ) : (
            <Empty>No clinic data available.</Empty>
          )}
        </Panel>

        <Panel>
          <PanelHead>
            <PanelTitle>Top companies — this month</PanelTitle>
          </PanelHead>
          {loading && !insights ? (
            <Skeleton $h="180px" />
          ) : topCompaniesChartData ? (
            <div style={{ height: Math.max(insights.topCompanies.length * 34, 140) }}>
              <Bar data={topCompaniesChartData} options={topCompaniesChartOptions} />
            </div>
          ) : (
            <Empty>No company data available.</Empty>
          )}
        </Panel>
      </Section>

      {/* Top services + latest appointments + latest messages */}
      <Section $cols="0.85fr 1.4fr 1.1fr">
        <Panel>
          <PanelHead>
            <PanelTitle>Top services</PanelTitle>
          </PanelHead>
          {loading && !stats ? (
            <Skeleton $h="160px" />
          ) : topServices?.count?.count?.length ? (
            <>
              <div style={{ height: 150 }}>
                <Doughnut
                  data={topServicesChartData}
                  options={{ maintainAspectRatio: false, cutout: "62%", plugins: { legend: { display: false } } }}
                />
              </div>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {topServices.count.count.map(({ title, count }, i) => (
                  <BacklogLegendRow key={title}>
                    <span>
                      <Dot $color={topServicesChartData.datasets[0].backgroundColor[i]} />
                      {title}
                    </span>
                    <strong>{count}</strong>
                  </BacklogLegendRow>
                ))}
              </div>
            </>
          ) : (
            <Empty>No service data available.</Empty>
          )}
        </Panel>

        <ScrollPanel>
          <PanelHead>
            <PanelTitle>Latest appointments</PanelTitle>
          </PanelHead>
          {latestAppointments?.length ? (
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>User</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {latestAppointments.map((appointment) => (
                    <tr key={appointment.id} title={appointment?.details?.company?.name}>
                      <td>{appointment?.details?.company?.name}</td>
                      <td>{appointment?.usersWhoCanManage ? appointment.usersWhoCanManage[0].name : ""}</td>
                      <td>{moment(appointment?.details?.date).format("DD MMM")}</td>
                      <td>
                        <StatusBadge $status={appointment?.status}>{appointment?.status}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
          ) : (
            <Empty>No recent appointments.</Empty>
          )}
        </ScrollPanel>

        <ScrollPanel>
          <PanelHead>
            <PanelTitle>Latest messages</PanelTitle>
          </PanelHead>
          {latestMessages?.length ? (
            latestMessages.map((message) => (
              <MessageItem key={`${message.appointment}-${message.createdAt}`}>
                <MessageHead>
                  <strong title={capitalize(message?.company)}>{capitalize(message?.company)}</strong>
                  <span>{capitalize(message?.author?.name)}</span>
                </MessageHead>
                <MessageBubble>{message?.message}</MessageBubble>
                <MessageFooter>
                  <span>{moment(message.createdAt).format("DD MMM, HH:mm")}</span>
                  <ReplyLink to={`appointment/${message.appointment}`}>
                    <FaReply size="0.6rem" /> reply
                  </ReplyLink>
                </MessageFooter>
              </MessageItem>
            ))
          ) : (
            <Empty>No recent messages.</Empty>
          )}
        </ScrollPanel>
      </Section>
    </Page>
  );
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(Dashboard);
