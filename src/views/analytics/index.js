import React, { useMemo, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { isEmpty, isNil, mergeAll, range, values } from "ramda";
import moment from "moment";
import { connect } from "react-redux";
import { useCachedFetch } from "../../hooks/useCachedFetch";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* ---------------------------------------------------------------------- */
/* Design tokens — shared with dashboard/index.js                         */
/* ---------------------------------------------------------------------- */

const token = {
  ink900: "#0F172A",
  ink700: "#334155",
  ink500: "#64748B",
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
  radius: "14px",
  radiusSm: "10px",
  shadow: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.10)",
};

const CLINIC_COLORS = { "All Clinics": token.ink500, Hendrina: token.primary, Churchill: token.danger };

const FontImport = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700;800&family=Noto+Sans:wght@400;500;600;700&display=swap');
`;

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

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  appearance: none;
  border: 1px solid ${token.line};
  background: ${token.surface};
  border-radius: 10px;
  padding: 9px 32px 9px 14px;
  font-size: 13px;
  font-weight: 600;
  color: ${token.ink900};
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  &:focus-visible {
    outline: 2px solid ${token.primary};
    outline-offset: 2px;
  }
`;

const RefreshButton = styled.button`
  appearance: none;
  border: none;
  background: ${token.primary};
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 9px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 150ms ease, opacity 150ms ease;
  &:hover { background: #1a3591; }
  &:disabled { opacity: 0.6; cursor: default; }
  &:focus-visible {
    outline: 2px solid ${token.primary};
    outline-offset: 2px;
  }
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: ${token.ink500};
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

const ErrorBanner = styled.div`
  background: #fbe9e9;
  border: 1px solid #f3c9c9;
  color: ${token.danger};
  border-radius: ${token.radiusSm};
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 20px;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  padding: 20px 22px;
`;

const SummaryLabel = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: ${token.ink500};
  margin: 0 0 8px;
`;

const SummaryValue = styled.span`
  font-family: "Figtree", sans-serif;
  font-size: 30px;
  font-weight: 700;
  display: block;
  margin-bottom: 12px;
`;

const ClinicSplitRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 5px 0;
  border-top: 1px solid ${token.lineSoft};
  &:first-of-type { border-top: none; padding-top: 0; }
`;

const ClinicSplitLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${token.ink700};
  font-weight: 600;
`;

const Dot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  display: inline-block;
`;

const SectionTitle = styled.h3`
  font-size: 17px;
  font-weight: 700;
  margin: 4px 0 14px;
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

const ChartPanel = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  padding: 20px 22px;
`;

const ChartPanelTitle = styled.h4`
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 14px;
`;

const Empty = styled.p`
  font-size: 13px;
  color: ${token.ink500};
  text-align: center;
  padding: 40px 0;
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

const exists = (i) => !isEmpty(i) && !isNil(i);

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n || 0);

const sumOf = (data) => (data ? Object.values(data).reduce((a, v) => a + (v || 0), 0) : 0);

const chartOptions = (title, formatY) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 }, color: token.ink500 } },
    tooltip: {
      backgroundColor: token.ink900,
      padding: 10,
      titleFont: { size: 12 },
      bodyFont: { size: 12, weight: "600" },
      callbacks: formatY ? { label: (ctx) => `${ctx.dataset.label}: ${formatY(ctx.parsed.y)}` } : undefined,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 }, color: token.ink500 } },
    y: {
      grid: { color: token.lineSoft },
      border: { display: false },
      ticks: { font: { size: 10 }, color: token.ink500, callback: formatY },
    },
  },
});

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

const Analytics = ({ user }) => {
  const [selectedMonth, setSelectedMonth] = useState(moment().format("MMMM"));
  const [selectedYear, setSelectedYear] = useState(moment().format("YYYY"));

  const type = user?.details?.adminType === "xrayAdmin" ? "x-rays" : "all";
  const date = `01-${selectedMonth}-${selectedYear}`;
  const enabled = exists(user);
  const cacheKey = `finance-analytics:${type}:${selectedMonth}:${selectedYear}`;

  const fetcher = useMemo(
    () => async () => {
      const res = await fetch(
        `${COMPANION_API_URL}/api/admin/finance-analytics?date=${date}&type=${type}`,
        { headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET } }
      );
      if (!res.ok) {
        throw new Error(`Failed to load finance analytics (${res.status})`);
      }
      return res.json();
    },
    [date, type]
  );

  const { data: analytics, loading, refreshing, error, cachedAt, refetch } = useCachedFetch(
    cacheKey,
    fetcher,
    { enabled }
  );

  const labels = range(1, moment(selectedMonth, "MMMM").daysInMonth() + 1).map(
    (d) =>
      `${selectedYear}-${moment(selectedMonth, "MMMM").format("MM")}-${d.toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        useGrouping: false,
      })}`
  );
  const dayLabels = labels.map((l) => moment(l).format("D"));

  const getValues = (data) => (!isNil(data) ? values(mergeAll(labels.map((d) => ({ [d]: data[d] ?? 0 })))) : []);

  const buildDataset = (metric) => ({
    labels: dayLabels,
    datasets: [
      { label: "All Clinics", data: getValues(analytics?.allClinics?.[metric]), backgroundColor: CLINIC_COLORS["All Clinics"], borderRadius: 3 },
      { label: "Hendrina", data: getValues(analytics?.hendrina?.[metric]), backgroundColor: CLINIC_COLORS.Hendrina, borderRadius: 3 },
      { label: "Churchill", data: getValues(analytics?.churchill?.[metric]), backgroundColor: CLINIC_COLORS.Churchill, borderRadius: 3 },
    ],
  });

  const financeData = buildDataset("amountsMade");
  const appointmentData = buildDataset("appointments");
  const employeeData = buildDataset("employeesCateredTo");
  const servicesData = buildDataset("servicesPerformed");

  const compsAndUsersData = {
    labels: dayLabels,
    datasets: [
      { label: "Companies Created", data: getValues(analytics?.companiesJoined), backgroundColor: token.secondary, borderRadius: 3 },
      { label: "New Users", data: getValues(analytics?.usersJoined), backgroundColor: token.primary, borderRadius: 3 },
    ],
  };

  const totalAppointments = sumOf(analytics?.allClinics?.appointments && getValues(analytics.allClinics.appointments));
  const totalEmployees = sumOf(analytics?.allClinics?.employeesCateredTo && getValues(analytics.allClinics.employeesCateredTo));
  const totalServices = sumOf(analytics?.allClinics?.servicesPerformed && getValues(analytics.allClinics.servicesPerformed));

  const summaryCards = [
    {
      label: "Total Appointments",
      value: totalAppointments,
      hendrina: sumOf(analytics?.hendrina?.appointments && getValues(analytics.hendrina.appointments)),
      churchill: sumOf(analytics?.churchill?.appointments && getValues(analytics.churchill.appointments)),
    },
    {
      label: "Total Employees Serviced",
      value: totalEmployees,
      hendrina: sumOf(analytics?.hendrina?.employeesCateredTo && getValues(analytics.hendrina.employeesCateredTo)),
      churchill: sumOf(analytics?.churchill?.employeesCateredTo && getValues(analytics.churchill.employeesCateredTo)),
    },
    {
      label: "Total Services Rendered",
      value: totalServices,
      hendrina: sumOf(analytics?.hendrina?.servicesPerformed && getValues(analytics.hendrina.servicesPerformed)),
      churchill: sumOf(analytics?.churchill?.servicesPerformed && getValues(analytics.churchill.servicesPerformed)),
    },
  ];

  return (
    <Page>
      <FontImport />

      <TopBar>
        <div>
          <Eyebrow>Monthly report</Eyebrow>
          <PageTitle>Analytics</PageTitle>
          <PageSub>
            How ClinicPlus performed in {selectedMonth} {selectedYear}
            {analytics && (
              <StatusPill $refreshing={refreshing} style={{ marginLeft: 10 }}>
                {refreshing ? "Refreshing" : cachedAt ? `Updated ${moment(cachedAt).fromNow()}` : "Live"}
              </StatusPill>
            )}
          </PageSub>
        </div>
        <Controls>
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {range(1, 13).map((m) => {
              const month = moment(m, "MM").format("MMMM");
              return (
                <option value={month} key={month}>
                  {month}
                </option>
              );
            })}
          </Select>
          <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {range(2022, 2027).map((y) => (
              <option value={y} key={y}>
                {y}
              </option>
            ))}
          </Select>
          <RefreshButton onClick={refetch} disabled={loading || refreshing}>
            {loading || refreshing ? "Loading…" : "Refresh"}
          </RefreshButton>
        </Controls>
      </TopBar>

      {error && <ErrorBanner>Failed to load analytics: {error}</ErrorBanner>}

      <SummaryGrid>
        {loading && !analytics
          ? Array.from({ length: 3 }).map((_, i) => (
              <SummaryCard key={i}>
                <Skeleton $h="12px" $w="60%" style={{ marginBottom: 12 }} />
                <Skeleton $h="30px" $w="40%" style={{ marginBottom: 16 }} />
                <Skeleton $h="14px" $w="100%" />
              </SummaryCard>
            ))
          : summaryCards.map((card) => (
              <SummaryCard key={card.label}>
                <SummaryLabel>{card.label}</SummaryLabel>
                <SummaryValue>{card.value}</SummaryValue>
                <ClinicSplitRow>
                  <ClinicSplitLabel>
                    <Dot $color={CLINIC_COLORS.Hendrina} />
                    Hendrina
                  </ClinicSplitLabel>
                  <strong>{card.hendrina}</strong>
                </ClinicSplitRow>
                <ClinicSplitRow>
                  <ClinicSplitLabel>
                    <Dot $color={CLINIC_COLORS.Churchill} />
                    Churchill
                  </ClinicSplitLabel>
                  <strong>{card.churchill}</strong>
                </ClinicSplitRow>
              </SummaryCard>
            ))}
      </SummaryGrid>

      <SectionTitle>Breakdown</SectionTitle>

      {loading && !analytics ? (
        <ChartGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <ChartPanel key={i}>
              <Skeleton $h="220px" />
            </ChartPanel>
          ))}
        </ChartGrid>
      ) : analytics ? (
        <ChartGrid>
          <ChartPanel>
            <ChartPanelTitle>Gross Appointment Pay</ChartPanelTitle>
            <div style={{ height: 240 }}>
              <Bar options={chartOptions("Gross Appointment Pay", formatCurrency)} data={financeData} />
            </div>
          </ChartPanel>
          <ChartPanel>
            <ChartPanelTitle>Appointments</ChartPanelTitle>
            <div style={{ height: 240 }}>
              <Bar options={chartOptions("Appointments")} data={appointmentData} />
            </div>
          </ChartPanel>
          <ChartPanel>
            <ChartPanelTitle>Employees Serviced</ChartPanelTitle>
            <div style={{ height: 240 }}>
              <Bar options={chartOptions("Employees Serviced")} data={employeeData} />
            </div>
          </ChartPanel>
          <ChartPanel>
            <ChartPanelTitle>Services Rendered</ChartPanelTitle>
            <div style={{ height: 240 }}>
              <Bar options={chartOptions("Services Rendered")} data={servicesData} />
            </div>
          </ChartPanel>
          <ChartPanel style={{ gridColumn: "1 / -1" }}>
            <ChartPanelTitle>Companies Created vs New Users</ChartPanelTitle>
            <div style={{ height: 240 }}>
              <Bar options={chartOptions("Companies Created vs New Users")} data={compsAndUsersData} />
            </div>
          </ChartPanel>
        </ChartGrid>
      ) : (
        <Empty>No analytics data available for this month.</Empty>
      )}
    </Page>
  );
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(Analytics);
