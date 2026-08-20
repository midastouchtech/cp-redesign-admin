import React, { useMemo, useState } from "react";
import moment from "moment";
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
  StatusBadge,
  token,
} from "../../components/ListPage";
import { adminApi } from "../../lib/adminApi";
import { useCachedFetch } from "../../hooks/useCachedFetch";
import { connect } from "react-redux";

const LABELS = {
  block_new_appointments: "Block new appointments",
  block_new_signups: "Block new signups",
  block_new_companies: "Block new companies",
  block_admin_creation: "Block admin creation",
};

function actor(user) {
  return {
    actorId: user?.id,
    actorName: `${user?.details?.name || ""} ${user?.details?.surname || ""}`.trim(),
  };
}

const SystemControls = ({ user }) => {
  const [reason, setReason] = useState("");
  const [publicMessage, setPublicMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const controlsFetcher = useMemo(() => () => adminApi("/api/admin/platform-controls"), []);
  const auditFetcher = useMemo(
    () => () => adminApi("/api/audit/events?entityType=platform_control&page=1&pageSize=20"),
    []
  );

  const { data, loading, error, refetch } = useCachedFetch("platform-controls", controlsFetcher);
  const { data: auditData, refetch: refetchAudit } = useCachedFetch("platform-control-audit", auditFetcher);
  const controls = data?.controls || [];
  const active = controls.filter((control) => control.enabled);

  const toggleControl = async (control) => {
    setActionError("");
    if (!reason.trim()) {
      setActionError("Add a reason before changing a platform control.");
      return;
    }
    setBusyKey(control.key);
    try {
      await adminApi(`/api/admin/platform-controls/${control.key}`, {
        method: "PATCH",
        body: JSON.stringify({
          enabled: !control.enabled,
          reason,
          publicMessage,
          expiresAt: expiresAt || null,
          confirmText: control.key,
          ...actor(user),
        }),
      });
      setReason("");
      setPublicMessage("");
      setExpiresAt("");
      await refetch();
      await refetchAudit();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyKey("");
    }
  };

  const lockdown = async (enabled) => {
    setActionError("");
    if (!reason.trim()) {
      setActionError("Add a reason before changing global lockdown.");
      return;
    }
    const confirmText = window.prompt("Type GLOBAL LOCKDOWN to confirm");
    if (confirmText !== "GLOBAL LOCKDOWN") return;
    setBusyKey("global");
    try {
      await adminApi("/api/admin/platform-controls/lockdown", {
        method: "POST",
        body: JSON.stringify({
          enabled,
          reason,
          publicMessage,
          expiresAt: expiresAt || null,
          confirmText,
          ...actor(user),
        }),
      });
      setReason("");
      setPublicMessage("");
      setExpiresAt("");
      await refetch();
      await refetchAudit();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyKey("");
    }
  };

  return (
    <Page>
      <FontImport />
      <PageHeader
        eyebrow="System"
        title="System Controls"
        subtitle="Platform kill-switches, customer-facing messages, and control audit history."
        actions={
          <>
            <Button type="button" $variant="ghost" onClick={() => lockdown(false)} disabled={busyKey === "global"}>
              Disable lockdown
            </Button>
            <Button type="button" onClick={() => lockdown(true)} disabled={busyKey === "global"}>
              Enable lockdown
            </Button>
          </>
        }
      />

      {active.length > 0 && (
        <StatusMessage $tone="danger">
          {active.length} platform control{active.length === 1 ? " is" : "s are"} active.
        </StatusMessage>
      )}
      {error && <StatusMessage $tone="danger">Failed to load controls: {error}</StatusMessage>}
      {actionError && <StatusMessage $tone="danger">{actionError}</StatusMessage>}

      <Toolbar>
        <Field $flex="1 1 260px" $minWidth="240px">
          <FieldLabel>Reason</FieldLabel>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required for every change" />
        </Field>
        <Field $flex="1 1 260px" $minWidth="240px">
          <FieldLabel>Public message</FieldLabel>
          <Input value={publicMessage} onChange={(e) => setPublicMessage(e.target.value)} placeholder="Optional customer/admin message" />
        </Field>
        <Field $minWidth="190px">
          <FieldLabel>Expires at</FieldLabel>
          <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </Field>
      </Toolbar>

      <TablePanel>
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <th>Control</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Public message</th>
                <th>Last changed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6">Loading controls...</td>
                </tr>
              )}
              {controls.map((control) => (
                <tr key={control.key}>
                  <td><strong>{LABELS[control.key] || control.key}</strong></td>
                  <td><StatusBadge status={control.enabled ? "declined" : "approved"} /> {control.enabled ? "Active" : "Off"}</td>
                  <td>{control.reason || "-"}</td>
                  <td>{control.publicMessage || "-"}</td>
                  <td>{control.setAt ? moment(control.setAt).format("DD MMM YYYY HH:mm") : "-"}</td>
                  <td>
                    <Button type="button" $variant={control.enabled ? "ghost" : undefined} onClick={() => toggleControl(control)} disabled={busyKey === control.key}>
                      {control.enabled ? "Switch off" : "Switch on"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableScroll>
      </TablePanel>

      <h4 style={{ marginTop: 24, color: token.ink900 }}>Recent control history</h4>
      <TablePanel>
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <th>Control</th>
                <th>Actor</th>
                <th>Reason</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {(auditData?.events || []).map((event) => (
                <tr key={event.id}>
                  <td>{event.entityId}</td>
                  <td>{event.actorName || event.actorId || "System"}</td>
                  <td>{event.metadata?.reason || event.metadata?.after?.reason || "-"}</td>
                  <td>{moment(event.createdAt).format("DD MMM YYYY HH:mm")}</td>
                </tr>
              ))}
              {!(auditData?.events || []).length && (
                <tr>
                  <td colSpan="4">No platform-control audit events yet.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableScroll>
      </TablePanel>
    </Page>
  );
};

const mapStateToProps = (state) => ({ user: state.auth.user });
export default connect(mapStateToProps)(SystemControls);
