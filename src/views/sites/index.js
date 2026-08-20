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
  Select,
  Button,
  StatusMessage,
  TablePanel,
  TableScroll,
  Table,
  RowActionLink,
  EmptyState,
  Pagination,
  StatusBadge,
} from "../../components/ListPage";
import { useCachedFetch } from "../../hooks/useCachedFetch";

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "dormant", label: "Dormant" },
];

const Sites = () => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);

  const cacheKey = `admin-sites:${search}:${status}:${page}`;
  const fetcher = useMemo(
    () => async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const res = await fetch(`${COMPANION_API_URL}/api/admin/sites?${params}`, {
        headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET },
      });
      if (!res.ok) throw new Error(`Failed to load sites (${res.status})`);
      return res.json();
    },
    [search, status, page]
  );

  const { data, loading, refreshing, error, cachedAt } = useCachedFetch(cacheKey, fetcher);

  const handleSearch = () => {
    setPage(0);
    setSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setPage(0);
  };

  const handleStatusChange = (e) => {
    setPage(0);
    setStatus(e.target.value);
  };

  const sites = data?.sites || [];

  return (
    <Page>
      <FontImport />
      <PageHeader
        eyebrow="Directory"
        title="Sites"
        subtitle={
          data
            ? `${data.totalCount} client worksites on record${
                cachedAt ? ` · updated ${new Date(cachedAt).toLocaleTimeString()}` : ""
              }${refreshing ? " · refreshing…" : ""}`
            : "Client worksites (e.g. mine names) typed on appointments, deduplicated into a directory"
        }
        actions={
          <Button as={Link} to="/sites/duplicates" $variant="ghost">
            Review duplicates
          </Button>
        }
      />

      <Toolbar>
        <Field $flex="1 1 320px" $minWidth="240px">
          <FieldLabel>Search</FieldLabel>
          <Input
            type="text"
            placeholder="Site name"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </Field>
        <Field $minWidth="180px">
          <FieldLabel>Status</FieldLabel>
          <Select value={status} onChange={handleStatusChange}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </Button>
        <Button $variant="ghost" onClick={handleClear}>
          Clear
        </Button>
      </Toolbar>

      {error && <StatusMessage $tone="danger">Failed to load sites: {error}</StatusMessage>}

      <TablePanel>
        <TableScroll>
          {sites.length ? (
            <Table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Appointments</th>
                  <th>Companies</th>
                  <th>Last used</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site._id}>
                    <td>{site.name}</td>
                    <td>
                      <StatusBadge status={site.status} />
                    </td>
                    <td>{site.appointmentCount ?? 0}</td>
                    <td>{site.companyIds?.length ?? 0}</td>
                    <td>{site.lastUsedAt ? new Date(site.lastUsedAt).toLocaleDateString() : "—"}</td>
                    <td>
                      <RowActionLink as={Link} to={`/sites/${site._id}`}>
                        View
                      </RowActionLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState
              title="No sites found"
              subtitle={data ? "Try a different search term or status filter." : "Loading…"}
            />
          )}
        </TableScroll>
        <Pagination page={page} pageCount={data?.pageCount || 0} onChange={setPage} />
      </TablePanel>
    </Page>
  );
};

export default Sites;
