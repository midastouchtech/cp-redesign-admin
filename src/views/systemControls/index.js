import React, { useEffect, useMemo, useState } from "react";
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

const DEFAULT_CLINICS = ["Hendrina", "Churchill"];

const clinicKey = (value) => String(value || "").trim().toLowerCase();

const getClinicLimitValue = (limits, clinic) => {
  if (!limits) return "";
  if (limits[clinic] != null) return limits[clinic];
  const matchingKey = Object.keys(limits).find((key) => clinicKey(key) === clinicKey(clinic));
  return matchingKey ? limits[matchingKey] : "";
};

function actor(user) {
  return {
    actorId: user?.id,
    actorName: `${user?.details?.name || ""} ${user?.details?.surname || ""}`.trim(),
  };
}

const SystemControls = ({ user, socket }) => {
  const [reason, setReason] = useState("");
  const [publicMessage, setPublicMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [showAbout, setShowAbout] = useState(false);
  const [systemSettings, setSystemSettings] = useState(null);
  const [clinicLimits, setClinicLimits] = useState({});
  const [clinicSettingsStatus, setClinicSettingsStatus] = useState("");
  const [localControls, setLocalControls] = useState(null);

  const controlsFetcher = useMemo(() => () => adminApi("/api/admin/platform-controls"), []);
  const auditFetcher = useMemo(
    () => () => adminApi("/api/audit/events?entityType=platform_control&page=1&pageSize=20"),
    []
  );

  const { data, loading, error, refetch } = useCachedFetch("platform-controls", controlsFetcher);
  const { data: auditData, refetch: refetchAudit } = useCachedFetch("platform-control-audit", auditFetcher);
  const controls = localControls || data?.controls || [];
  const active = controls.filter((control) => control.enabled);
  const clinics = [
    ...DEFAULT_CLINICS,
    ...Object.keys(clinicLimits || {}).filter(
      (clinic) => !DEFAULT_CLINICS.some((defaultClinic) => clinicKey(defaultClinic) === clinicKey(clinic))
    ),
  ];

  useEffect(() => {
    if (!socket) return undefined;

    const receiveSettings = (settings) => {
      const nextSettings = settings || {};
      setSystemSettings(nextSettings);
      setClinicLimits(nextSettings.limits || {});
      setClinicSettingsStatus("");
    };

    const fetchSettings = () => socket.emit("GET_SYSTEM_SETTINGS");

    fetchSettings();
    socket.on("RECEIVE_SYSTEM_SETTINGS", receiveSettings);
    socket.on("FETCH_SYSTEM_SETTINGS", fetchSettings);

    return () => {
      socket.off("RECEIVE_SYSTEM_SETTINGS", receiveSettings);
      socket.off("FETCH_SYSTEM_SETTINGS", fetchSettings);
    };
  }, [socket]);

  useEffect(() => {
    if (data?.controls) {
      setLocalControls(data.controls);
    }
  }, [data]);

  const toggleControl = async (control) => {
    setActionError("");
    const nextEnabled = !control.enabled;
    const nextReason = reason.trim() || "Changed from System controls";
    const previousControls = controls;
    const optimisticControl = {
      ...control,
      enabled: nextEnabled,
      reason: nextReason,
      publicMessage,
      expiresAt: expiresAt || null,
      setAt: new Date().toISOString(),
    };

    setLocalControls((current) =>
      (current || controls).map((item) => (item.key === control.key ? optimisticControl : item))
    );
    setBusyKey(control.key);
    try {
      const result = await adminApi(`/api/admin/platform-controls/${control.key}`, {
        method: "PATCH",
        body: JSON.stringify({
          enabled: nextEnabled,
          reason: nextReason,
          publicMessage,
          expiresAt: expiresAt || null,
          confirmText: control.key,
          ...actor(user),
        }),
      });
      setLocalControls((current) =>
        (current || controls).map((item) => (item.key === control.key ? result.control : item))
      );
      setReason("");
      setPublicMessage("");
      setExpiresAt("");
      await refetch();
      await refetchAudit();
    } catch (err) {
      setLocalControls(previousControls);
      setActionError(err.message);
    } finally {
      setBusyKey("");
    }
  };

  const lockdown = async (enabled) => {
    setActionError("");
    const nextReason = reason.trim() || "Changed from System controls";
    const confirmText = window.prompt("Type GLOBAL LOCKDOWN to confirm");
    if (confirmText !== "GLOBAL LOCKDOWN") return;
    const previousControls = controls;
    setLocalControls((current) =>
      (current || controls).map((control) => ({
        ...control,
        enabled,
        reason: nextReason,
        publicMessage,
        expiresAt: expiresAt || null,
        setAt: new Date().toISOString(),
      }))
    );
    setBusyKey("global");
    try {
      const result = await adminApi("/api/admin/platform-controls/lockdown", {
        method: "POST",
        body: JSON.stringify({
          enabled,
          reason: nextReason,
          publicMessage,
          expiresAt: expiresAt || null,
          confirmText,
          ...actor(user),
        }),
      });
      if (result.controls) setLocalControls(result.controls);
      setReason("");
      setPublicMessage("");
      setExpiresAt("");
      await refetch();
      await refetchAudit();
    } catch (err) {
      setLocalControls(previousControls);
      setActionError(err.message);
    } finally {
      setBusyKey("");
    }
  };

  const updateClinicLimit = (clinic, value) => {
    setClinicLimits((current) => ({
      ...current,
      [clinic]: value,
    }));
  };

  const saveClinicLimits = () => {
    setClinicSettingsStatus("");
    if (!socket) {
      setClinicSettingsStatus("Socket connection is not ready.");
      return;
    }
    if (!systemSettings?._id) {
      setClinicSettingsStatus("System settings have not loaded yet.");
      return;
    }

    const limits = clinics.reduce((acc, clinic) => {
      const value = Number(getClinicLimitValue(clinicLimits, clinic));
      if (Number.isFinite(value) && value > 0) {
        acc[clinic] = value;
      }
      return acc;
    }, {});

    socket.emit("UPDATE_SYSTEM_SETTINGS", {
      ...systemSettings,
      limits,
    });
    setClinicSettingsStatus("Saving clinic booking limits...");
  };

  return (
    <Page>
      <FontImport />
      <PageHeader
        eyebrow="System"
        title="System"
        subtitle="Platform kill-switches, clinic booking limits, system details, and control audit history."
        actions={
          <>
            <Button type="button" $variant="ghost" onClick={() => setShowAbout(true)}>
              About
            </Button>
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
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional; default reason is recorded if empty" />
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

      <h4 style={{ marginTop: 24, color: token.ink900 }}>Clinic booking limits</h4>
      <TablePanel>
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <th>Clinic</th>
                <th>Allowed bookings per day</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((clinic) => (
                <tr key={clinic}>
                  <td><strong>{clinic}</strong></td>
                  <td>
                    <Input
                      type="number"
                      min="1"
                      value={getClinicLimitValue(clinicLimits, clinic)}
                      onChange={(e) => updateClinicLimit(clinic, e.target.value)}
                      style={{ maxWidth: 180 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableScroll>
        <Toolbar>
          <Button type="button" onClick={saveClinicLimits}>
            Save booking limits
          </Button>
          {clinicSettingsStatus && <span style={{ color: token.ink500, fontSize: 13 }}>{clinicSettingsStatus}</span>}
        </Toolbar>
      </TablePanel>

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

      {showAbout && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,.35)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">About this system</h5>
                <button className="close" onClick={() => setShowAbout(false)}>×</button>
              </div>
              <div
                className="modal-body"
                style={{
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: token.ink700,
                  maxHeight: "58vh",
                  overflowY: "auto",
                }}
              >
                <p style={{ marginBottom: 8 }}>
                  <strong>ClinicPlus Admin System</strong> · Version 3.1
                </p>
                <p style={{ marginBottom: 8 }}>
                  This system was built by Qwabi Engineering for ClinicPlus Booking Pty Ltd, with Tecla Digital acting
                  as the facilitation partner between the parties.
                </p>
                <p style={{ marginBottom: 8 }}>
                  Qwabi Engineering owns the system source code, software architecture, interface designs, and custom
                  technical assets. ClinicPlus Booking Pty Ltd owns its business data, customer records, appointment
                  records, uploaded documents, and operational content stored or processed through the deployed web
                  application.
                </p>
                <p style={{ marginBottom: 8 }}>
                  The deployed web application is provided for ClinicPlus Booking Pty Ltd's operational use. By using
                  this system or holding an account on it, users agree to use it responsibly, keep login details secure,
                  and accept that Qwabi Engineering is not liable for data loss, theft, misuse, unauthorized access,
                  service interruption, user error, third-party provider failures, hosting outages, or damages arising
                  from use of the system, except where required by applicable law.
                </p>
                <p style={{ marginBottom: 8 }}>
                  Qwabi Engineering does not claim ownership of ClinicPlus data. ClinicPlus remains responsible for
                  data accuracy, user access decisions, backups, compliance obligations, and internal business processes.
                  Users and client companies indemnify Qwabi Engineering against claims arising from their use,
                  configuration, account access, uploaded content, or operational decisions made through this system.
                </p>
                <p style={{ marginBottom: 8 }}>
                  Contact: <a href="mailto:aya@qwabi.co.za">aya@qwabi.co.za</a> ·{" "}
                  <a href="https://business.qwabi.co.za" target="_blank" rel="noreferrer">business.qwabi.co.za</a> ·{" "}
                  <a href="https://wa.me/27603116777" target="_blank" rel="noreferrer">WhatsApp Ayabonga Qwabi</a>
                </p>
                <div style={{ borderTop: `1px solid ${token.line}`, marginTop: 12, paddingTop: 12 }}>
                  <p style={{ marginBottom: 6, fontWeight: 800, color: token.ink900 }}>Recent change log</p>
                  <p style={{ marginBottom: 8 }}>
                    Commercial note: all commits before the latest production delivery were paid project work. New
                    commits after that delivery are free changes provided by Qwabi Engineering.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>20 Aug 2026 · 9f45aa5 · Added admin controls and support workflows.</li>
                    <li>20 Aug 2026 · 56b11f4 · Added Sites, Audit, and Platform Signals admin pages.</li>
                    <li>20 Aug 2026 · 53fc7c0 · Added Availability Checker, Employees, and Messaging admin pages.</li>
                    <li>20 Aug 2026 · 570cc62 · Added clinic-capacity views for day, week, and month availability.</li>
                    <li>20 Aug 2026 · f23f513 · Prefetched and background-refreshed cp-companion-backed pages on app load.</li>
                    <li>20 Aug 2026 · 4c87eac · Fixed invoice quote pricing, PDF markup, and duplicate client emails.</li>
                    <li>20 Aug 2026 · 6f655da · Redesigned Appointments, Clients, Companies, and Administrators list pages.</li>
                    <li>20 Aug 2026 · fa16969 · Redesigned dashboard and analytics pages.</li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setShowAbout(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
