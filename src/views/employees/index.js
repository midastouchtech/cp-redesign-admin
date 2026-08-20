import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FontImport,
  Page,
  PageHeader,
  Toolbar,
  Field,
  FieldLabel,
  Input,
  Button,
  StatusMessage,
  TablePanel,
  TableScroll,
  Table,
  RowActionLink,
  EmptyState,
  Pagination,
  token,
} from "../../components/ListPage";
import { useCachedFetch } from "../../hooks/useCachedFetch";

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n || 0);

const MatchBadge = ({ confidence }) => {
  const verified = confidence === "verified";
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 999,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        background: verified ? token.successSoft : token.warningSoft,
        color: verified ? token.success : token.warning,
      }}
      title={verified ? "Matched by ID number" : "Matched by name only — may merge two different people"}
    >
      {verified ? "Verified" : "Unverified"}
    </span>
  );
};

const Employees = () => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const cacheKey = `admin-employees:${search}:${page}`;
  const fetcher = useMemo(
    () => async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      const res = await fetch(`${COMPANION_API_URL}/api/admin/employees?${params}`, {
        headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET },
      });
      if (!res.ok) throw new Error(`Failed to load employees (${res.status})`);
      return res.json();
    },
    [search, page]
  );

  const { data, loading, refreshing, error, cachedAt } = useCachedFetch(cacheKey, fetcher);

  const handleSearch = () => {
    setPage(0);
    setSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput("");
    setSearch("");
    setPage(0);
  };

  const employees = data?.employees || [];

  return (
    <Page>
      <FontImport />
      <PageHeader
        eyebrow="Directory"
        title="Employees"
        subtitle={
          data
            ? `${data.totalCount} employees found across all appointments${
                cachedAt ? ` · updated ${new Date(cachedAt).toLocaleTimeString()}` : ""
              }${refreshing ? " · refreshing…" : ""}`
            : "Every employee found in appointment data, deduplicated by ID number"
        }
      />

      <Toolbar>
        <Field $flex="1 1 320px" $minWidth="240px">
          <FieldLabel>Search</FieldLabel>
          <Input
            type="text"
            placeholder="Name or ID number"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </Field>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </Button>
        <Button $variant="ghost" onClick={handleClear}>
          Clear
        </Button>
      </Toolbar>

      {error && <StatusMessage $tone="danger">Failed to load employees: {error}</StatusMessage>}

      <TablePanel>
        <TableScroll>
          {employees.length ? (
            <Table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Match</th>
                  <th>Age / Gender</th>
                  <th>Occupation(s)</th>
                  <th>Appointments</th>
                  <th>Paid / Unpaid</th>
                  <th>Revenue</th>
                  <th>Last seen</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.displayName}</td>
                    <td>
                      <MatchBadge confidence={employee.matchConfidence} />
                    </td>
                    <td>
                      {employee.age != null ? `${employee.age}y` : "—"}
                      {employee.gender ? ` · ${employee.gender}` : ""}
                    </td>
                    <td>{employee.occupations?.join(", ") || "—"}</td>
                    <td>{employee.stats?.totalAppointments ?? 0}</td>
                    <td>
                      {employee.stats?.paidAppointments ?? 0} / {employee.stats?.unpaidAppointments ?? 0}
                    </td>
                    <td>{formatCurrency(employee.stats?.totalRevenue)}</td>
                    <td>{employee.lastSeenAt || "—"}</td>
                    <td>
                      <RowActionLink as={Link} to={`/employees/${employee._id}`}>
                        View
                      </RowActionLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState
              title="No employees found"
              subtitle={
                data
                  ? "Try a different search term."
                  : "Run the employee directory backfill script first."
              }
            />
          )}
        </TableScroll>
        <Pagination page={page} pageCount={data?.pageCount || 0} onChange={setPage} />
      </TablePanel>
    </Page>
  );
};

export default Employees;
