import React, { useMemo, useState } from "react";
import { connect } from "react-redux";
import { FontImport, Page, PageHeader, Toolbar, Field, FieldLabel, Select, Button, StatusMessage, TablePanel, TableScroll, Table } from "../../components/ListPage";
import { adminApi } from "../../lib/adminApi";
import { useCachedFetch } from "../../hooks/useCachedFetch";

const SupportTickets = ({ user }) => {
  const [status, setStatus] = useState("");
  const fetcher = useMemo(() => () => adminApi(`/api/admin/support-tickets${status ? `?status=${status}` : ""}`), [status]);
  const { data, loading, error, refetch } = useCachedFetch(`support-tickets:${status}`, fetcher);
  const [replyById, setReplyById] = useState({});
  const [actionError, setActionError] = useState("");

  const respond = async (ticket) => {
    const response = (replyById[ticket.id] || "").trim();
    if (!response) return;
    setActionError("");
    try {
      await adminApi(`/api/admin/support-tickets/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          response,
          status: "resolved",
          actorId: user?.id,
          actorName: `${user?.details?.name || ""} ${user?.details?.surname || ""}`.trim(),
        }),
      });
      setReplyById((prev) => ({ ...prev, [ticket.id]: "" }));
      await refetch();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <Page>
      <FontImport />
      <PageHeader eyebrow="Support" title="Support Tickets" subtitle="Requests, complaints, and suggestions submitted from the admin portal." />
      <Toolbar>
        <Field $minWidth="180px"><FieldLabel>Status</FieldLabel><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option><option value="open">Open</option><option value="resolved">Resolved</option></Select></Field>
      </Toolbar>
      {error && <StatusMessage $tone="danger">{error}</StatusMessage>}
      {actionError && <StatusMessage $tone="danger">{actionError}</StatusMessage>}
      <TablePanel><TableScroll><Table>
        <thead><tr><th>ID</th><th>Category</th><th>From</th><th>Message</th><th>Status</th><th>Reply</th></tr></thead>
        <tbody>
          {loading && <tr><td colSpan="6">Loading tickets...</td></tr>}
          {(data?.tickets || []).map((ticket) => (
            <tr key={ticket.id}>
              <td>{ticket.id}</td><td>{ticket.category}</td><td>{ticket.submittedByName}</td><td style={{ whiteSpace: "normal", minWidth: 260 }}>{ticket.message}</td><td>{ticket.status}</td>
              <td>
                <textarea value={replyById[ticket.id] || ""} onChange={(e) => setReplyById((prev) => ({ ...prev, [ticket.id]: e.target.value }))} style={{ width: 240, minHeight: 54 }} />
                <br /><Button type="button" onClick={() => respond(ticket)}>Send</Button>
              </td>
            </tr>
          ))}
          {!(data?.tickets || []).length && !loading && <tr><td colSpan="6">No tickets found.</td></tr>}
        </tbody>
      </Table></TableScroll></TablePanel>
    </Page>
  );
};

const mapStateToProps = (state) => ({ user: state.auth.user });
export default connect(mapStateToProps)(SupportTickets);
