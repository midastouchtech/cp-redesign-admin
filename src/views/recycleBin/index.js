import React, { useMemo, useState } from "react";
import { FontImport, Page, PageHeader, Toolbar, Field, FieldLabel, Select, Button, StatusMessage, TablePanel, TableScroll, Table } from "../../components/ListPage";
import { adminApi } from "../../lib/adminApi";
import { useCachedFetch } from "../../hooks/useCachedFetch";

const RecycleBin = () => {
  const [type, setType] = useState("");
  const [error, setError] = useState("");
  const fetcher = useMemo(() => () => adminApi(`/api/admin/recycle-bin${type ? `?type=${type}` : ""}`), [type]);
  const { data, loading, refetch } = useCachedFetch(`recycle-bin:${type}`, fetcher);
  const rows = (data?.groups || []).flatMap((group) => group.rows || []);

  const restore = async (row) => {
    const confirmText = window.prompt(`Type RESTORE ${row.id} to restore`);
    if (confirmText !== `RESTORE ${row.id}`) return;
    setError("");
    try {
      await adminApi("/api/admin/recycle-bin/restore", {
        method: "POST",
        body: JSON.stringify({ type: row.entityType, id: row.id, confirmText }),
      });
      await refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Page>
      <FontImport />
      <PageHeader eyebrow="Recovery" title="Recycle Bin" subtitle="Restore soft-deleted appointments, companies, and users." />
      <Toolbar>
        <Field $minWidth="180px"><FieldLabel>Type</FieldLabel><Select value={type} onChange={(e) => setType(e.target.value)}><option value="">All</option><option value="appointment">Appointments</option><option value="company">Companies</option><option value="user">Users</option></Select></Field>
      </Toolbar>
      {error && <StatusMessage $tone="danger">{error}</StatusMessage>}
      <TablePanel><TableScroll><Table>
        <thead><tr><th>Type</th><th>ID</th><th>Name</th><th>Date</th><th></th></tr></thead>
        <tbody>
          {loading && <tr><td colSpan="5">Loading deleted records...</td></tr>}
          {rows.map((row) => (
            <tr key={`${row.entityType}-${row._id}`}>
              <td>{row.entityType}</td>
              <td>{row.id}</td>
              <td>{row.details?.name || row.details?.company?.name || row.details?.email || "-"}</td>
              <td>{row.tracking?.[0]?.date || "-"}</td>
              <td><Button type="button" onClick={() => restore(row)}>Restore</Button></td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan="5">No deleted records found.</td></tr>}
        </tbody>
      </Table></TableScroll></TablePanel>
    </Page>
  );
};

export default RecycleBin;
