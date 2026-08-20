import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import styled from "styled-components";
import {
  FontImport,
  Page,
  PageHeader,
  StatusMessage,
  EmptyState,
  RowActionLink,
  token,
} from "../../components/ListPage";
import { useCachedFetch } from "../../hooks/useCachedFetch";

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

/**
 * Read-only mirror of cp-companion's internal /admin/platform superadmin dashboard, fetched from
 * cp-companion's /api/admin/platform-signals (shared-secret gated, same shared-secret pattern as
 * every other companion-backed page in this app — cp-redesign-admin's admins have no login into
 * cp-companion itself, so that page's own isSuperadmin gate doesn't apply here).
 *
 * All six sections read from cp-companion's hourly sync pipeline's derived collections, never
 * live production. Nothing on this page writes anything.
 */

const SectionCard = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  padding: 16px 18px;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 4px;
`;

const SectionHint = styled.p`
  font-size: 12px;
  color: ${token.ink500};
  margin: 0 0 12px;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid ${token.lineSoft};
  font-size: 13px;
  &:last-child {
    border-bottom: none;
  }
`;

const RowMain = styled.span`
  color: ${token.ink900};
  font-weight: 600;
`;

const RowMeta = styled.span`
  color: ${token.ink500};
  font-size: 12px;
  text-align: right;
  white-space: nowrap;
`;

const BadgeEl = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  text-transform: capitalize;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$fg};
`;

const syncStatusTone = (status) => {
  if (status === "success") return { bg: token.successSoft, fg: token.success };
  if (status === "partial") return { bg: token.warningSoft, fg: token.warning };
  return { bg: token.dangerSoft, fg: token.danger };
};

const flagTone = () => ({ bg: token.warningSoft, fg: token.warning });

const SyncBadge = ({ status }) => {
  const tone = syncStatusTone(status);
  return (
    <BadgeEl $bg={tone.bg} $fg={tone.fg}>
      {status}
    </BadgeEl>
  );
};

const FlagBadge = ({ children }) => {
  const tone = flagTone();
  return (
    <BadgeEl $bg={tone.bg} $fg={tone.fg}>
      {children}
    </BadgeEl>
  );
};

const JobList = styled.ul`
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  font-size: 12px;
  color: ${token.ink500};
`;

const JobItem = styled.li`
  padding: 3px 0;
`;

const Signals = () => {
  const fetcher = useMemo(
    () => async () => {
      const res = await fetch(`${COMPANION_API_URL}/api/admin/platform-signals`, {
        headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET },
      });
      if (!res.ok) throw new Error(`Failed to load platform signals (${res.status})`);
      return res.json();
    },
    []
  );

  const { data, loading, error, refreshing, cachedAt } = useCachedFetch(
    "platform-signals",
    fetcher,
    { enabled: !!COMPANION_API_URL && !!COMPANION_STATS_SECRET }
  );

  const lastRun = data?.recentSyncRuns?.[0];

  return (
    <Page>
      <FontImport />
      <PageHeader
        eyebrow="Operations"
        title="Platform Signals"
        subtitle={
          "Read-only view of cp-companion's hourly sync pipeline output — dormancy, adoption, data quality, and pricing " +
          "anomalies across the platform. Never reads live production." +
          (cachedAt ? ` · updated ${moment(cachedAt).fromNow()}` : "") +
          (refreshing ? " · refreshing…" : "")
        }
      />

      {(!COMPANION_API_URL || !COMPANION_STATS_SECRET) && (
        <StatusMessage $tone="danger">
          REACT_APP_COMPANION_API_URL / REACT_APP_COMPANION_STATS_SECRET is not configured.
        </StatusMessage>
      )}

      {error && <StatusMessage $tone="danger">Failed to load platform signals: {error}</StatusMessage>}

      {loading && !data && <StatusMessage>Loading…</StatusMessage>}

      {data && (
        <>
          {/* Last sync run */}
          <SectionCard>
            <SectionTitle>Last sync run</SectionTitle>
            {lastRun ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SyncBadge status={lastRun.status} />
                  <span style={{ fontSize: 12, color: token.ink500 }}>
                    {moment(lastRun.startedAt).format("D MMM YYYY, HH:mm")}
                  </span>
                </div>
                <JobList>
                  {lastRun.jobs?.map((j) => (
                    <JobItem key={j.name}>
                      {j.name}: {j.processed} processed, {j.errors} errors ({j.durationMs}ms)
                    </JobItem>
                  ))}
                </JobList>
              </>
            ) : (
              <EmptyState title="No sync runs recorded yet" />
            )}
          </SectionCard>

          {/* Platform adoption */}
          <SectionCard>
            <SectionTitle>Platform adoption</SectionTitle>
            {data.adoptionMetric ? (
              <p style={{ fontSize: 13, color: token.ink700, margin: 0 }}>
                <strong>{(data.adoptionMetric.adoptionRate * 100).toFixed(1)}%</strong> of all appointments (
                {data.adoptionMetric.companionCreatedAppointments} of {data.adoptionMetric.totalAppointments}) were
                created through Companion, as of {moment(data.adoptionMetric.computedAt).format("D MMM YYYY, HH:mm")}.
              </p>
            ) : (
              <EmptyState title="No adoption data yet" />
            )}
          </SectionCard>

          {/* Dormant companies */}
          <SectionCard>
            <SectionTitle>Dormant companies ({data.dormancy?.length || 0})</SectionTitle>
            <SectionHint>
              Companies quiet for more than 2x their own historical booking interval. Outreach list only — nothing
              here is emailed automatically.
            </SectionHint>
            {!data.dormancy?.length ? (
              <EmptyState title="None flagged" />
            ) : (
              <List>
                {data.dormancy.map((d) => (
                  <Row key={d.companyId}>
                    <RowMain>{d.companyName}</RowMain>
                    <RowMeta>
                      {d.daysSinceLastBooking}d since last booking (avg interval {d.avgBookingIntervalDays}d)
                    </RowMeta>
                  </Row>
                ))}
              </List>
            )}
          </SectionCard>

          {/* New ClinicPlus companies not on Companion */}
          <SectionCard>
            <SectionTitle>New ClinicPlus companies not on Companion ({data.newLeads?.length || 0})</SectionTitle>
            {!data.newLeads?.length ? (
              <EmptyState title="None flagged" />
            ) : (
              <List>
                {data.newLeads.map((l) => (
                  <Row key={l.companyId}>
                    <RowMain>{l.companyName}</RowMain>
                    <RowMeta>first seen {moment(l.firstSeenAt).format("D MMM YYYY")}</RowMeta>
                  </Row>
                ))}
              </List>
            )}
          </SectionCard>

          {/* Data quality sweep */}
          <SectionCard>
            <SectionTitle>Data quality sweep ({data.dataQuality?.length || 0})</SectionTitle>
            {!data.dataQuality?.length ? (
              <EmptyState title="No flags" />
            ) : (
              <List>
                {data.dataQuality.map((f, i) => (
                  <Row key={f._id || i}>
                    <span>
                      <FlagBadge>{f.flagType}</FlagBadge>{" "}
                      <span style={{ color: token.ink700 }}>{f.detail}</span>
                    </span>
                  </Row>
                ))}
              </List>
            )}
          </SectionCard>

          {/* Pricing anomalies */}
          <SectionCard>
            <SectionTitle>Pricing anomalies ({data.anomalies?.length || 0})</SectionTitle>
            <SectionHint>
              Appointments whose stored payment amount doesn't match what recomputing the booking price produces.
              Directly actionable — click through to investigate a specific appointment.
            </SectionHint>
            {!data.anomalies?.length ? (
              <EmptyState title="No mismatches between stored and recomputed pricing" />
            ) : (
              <List>
                {data.anomalies.map((a) => (
                  <Row key={a.appointmentId}>
                    <RowActionLink as={Link} to={`/appointment/${a.appointmentId}`}>
                      {a.appointmentId}
                    </RowActionLink>
                    <RowMeta>
                      stored R{a.storedAmount} vs recomputed R{a.recomputedAmount} (diff {a.difference})
                    </RowMeta>
                  </Row>
                ))}
              </List>
            )}
          </SectionCard>
        </>
      )}
    </Page>
  );
};

export default Signals;
