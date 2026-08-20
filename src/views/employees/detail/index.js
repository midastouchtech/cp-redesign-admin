import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { FontImport, Page, PageHeader, StatusMessage, EmptyState, token } from "../../../components/ListPage";
import { useCachedFetch } from "../../../hooks/useCachedFetch";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n || 0);

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  padding: 16px 18px;
`;

const StatLabel = styled.p`
  font-size: 12px;
  font-weight: 600;
  color: ${token.ink500};
  margin: 0 0 6px;
`;

const StatValue = styled.span`
  font-family: "Figtree", sans-serif;
  font-size: 24px;
  font-weight: 700;
`;

const Panel = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  padding: 18px 20px;
  margin-bottom: 16px;
`;

const PanelTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 12px;
`;

const CompanyRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid ${token.lineSoft};
  font-size: 13px;
  &:last-child {
    border-bottom: none;
  }
`;

const BackLink = styled(Link)`
  font-size: 12px;
  font-weight: 700;
  color: ${token.ink500};
  text-decoration: none;
  display: inline-block;
  margin-bottom: 10px;
  &:hover {
    color: ${token.brand};
  }
`;

const EmployeeDetail = () => {
  const { employeeId } = useParams();

  const fetcher = useMemo(
    () => async () => {
      const res = await fetch(`${COMPANION_API_URL}/api/admin/employees/${employeeId}`, {
        headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET },
      });
      if (!res.ok) throw new Error(`Failed to load employee (${res.status})`);
      return res.json();
    },
    [employeeId]
  );

  const { data: employee, loading, error } = useCachedFetch(`admin-employee:${employeeId}`, fetcher);

  const trend = employee?.stats?.monthlyTrend || [];
  const trendData = {
    labels: trend.map((t) => t.month),
    datasets: [
      {
        label: "Paid appointments",
        data: trend.map((t) => t.appointments),
        backgroundColor: token.brand,
        borderRadius: 4,
        yAxisID: "y",
      },
    ],
  };
  const revenueTrendData = {
    labels: trend.map((t) => t.month),
    datasets: [
      {
        label: "Revenue",
        data: trend.map((t) => t.revenue),
        backgroundColor: "#1E40AF",
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: token.lineSoft }, ticks: { font: { size: 10 } } },
    },
  };

  return (
    <Page>
      <FontImport />
      <BackLink to="/employees">← Back to employees</BackLink>

      {error && <StatusMessage $tone="danger">Failed to load employee: {error}</StatusMessage>}
      {loading && !employee && <StatusMessage>Loading…</StatusMessage>}

      {employee && (
        <>
          <PageHeader
            eyebrow="Employee profile"
            title={employee.displayName}
            subtitle={`ID ${employee.idNumber || "unknown"} · ${
              employee.matchConfidence === "verified" ? "Verified match" : "Unverified match (matched by name only)"
            } · First seen ${employee.firstSeenAt || "—"} · Last seen ${employee.lastSeenAt || "—"}`}
          />

          <Grid>
            <StatCard>
              <StatLabel>Total appointments</StatLabel>
              <StatValue>{employee.stats?.totalAppointments ?? 0}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Paid (approved)</StatLabel>
              <StatValue>{employee.stats?.paidAppointments ?? 0}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Unpaid (not approved)</StatLabel>
              <StatValue>{employee.stats?.unpaidAppointments ?? 0}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Total revenue (paid only)</StatLabel>
              <StatValue>{formatCurrency(employee.stats?.totalRevenue)}</StatValue>
            </StatCard>
          </Grid>

          <Grid style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Panel>
              <PanelTitle>Date of birth / Gender</PanelTitle>
              {employee.idNumberValid === true ? (
                <p style={{ fontSize: 13, color: token.ink700, margin: 0 }}>
                  {employee.dateOfBirth} · {employee.age} years old · {employee.gender}
                </p>
              ) : employee.idNumberValid === false ? (
                <p style={{ fontSize: 13, color: token.danger, margin: 0 }}>
                  ID number failed checksum validation — DOB/gender not derived.
                </p>
              ) : (
                <p style={{ fontSize: 13, color: token.ink500, margin: 0 }}>
                  No valid 13-digit SA ID number on file (may be a passport number).
                </p>
              )}
            </Panel>
            <Panel>
              <PanelTitle>Occupations seen</PanelTitle>
              <p style={{ fontSize: 13, color: token.ink700, margin: 0 }}>
                {employee.occupations?.join(", ") || "—"}
              </p>
            </Panel>
          </Grid>

          <Panel>
            <PanelTitle>Paid appointments by month</PanelTitle>
            <div style={{ height: 200 }}>
              {trend.length ? (
                <Bar data={trendData} options={chartOptions} />
              ) : (
                <EmptyState title="No trend data" subtitle="No paid appointments recorded yet." />
              )}
            </div>
          </Panel>

          <Panel>
            <PanelTitle>Revenue by month</PanelTitle>
            <div style={{ height: 200 }}>
              {trend.length ? (
                <Bar
                  data={revenueTrendData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      legend: { display: false },
                      tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.parsed.y) } },
                    },
                  }}
                />
              ) : (
                <EmptyState title="No revenue data" subtitle="No paid appointments recorded yet." />
              )}
            </div>
          </Panel>

          <Panel>
            <PanelTitle>Top companies (by appointment count)</PanelTitle>
            {employee.stats?.topCompanies?.length ? (
              employee.stats.topCompanies.map((c) => (
                <CompanyRow key={c.companyId}>
                  <span>{c.companyName || c.companyId}</span>
                  <strong>{c.appointmentCount} appointments</strong>
                </CompanyRow>
              ))
            ) : (
              <EmptyState title="No company data" subtitle="No appointments with a linked company yet." />
            )}
          </Panel>
        </>
      )}
    </Page>
  );
};

export default EmployeeDetail;
