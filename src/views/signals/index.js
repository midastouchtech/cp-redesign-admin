import React, { useMemo, useState } from "react";
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
  Pagination,
  Input,
  token,
} from "../../components/ListPage";
import { useCachedFetch } from "../../hooks/useCachedFetch";

const PAGE_SIZE = 5;

/**
 * Client-side search + sort + pagination for one signals list. All three lists (dormancy,
 * newLeads, anomalies) arrive fully loaded in a single fetch, so this filters/sorts/slices
 * in-memory rather than round-tripping to the backend — cheap at the volumes these lists run at
 * (outreach/review lists, not full production tables).
 *
 * `searchFn(item, query)` decides whether an item matches; `sortFns` is a map of
 * `{ key: (a, b) => number }` comparators the caller can toggle between and reverse.
 */
function useSearchSortPage(items, { searchFn, sortFns, defaultSortKey }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState(-1); // -1 = desc, 1 = asc
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const list = items || [];
    const q = query.trim().toLowerCase();
    return q ? list.filter((item) => searchFn(item, q)) : list;
  }, [items, query, searchFn]);

  const sorted = useMemo(() => {
    const cmp = sortFns[sortKey];
    if (!cmp) return filtered;
    return [...filtered].sort((a, b) => cmp(a, b) * sortDir);
  }, [filtered, sortFns, sortKey, sortDir]);

  const pageCount = Math.ceil(sorted.length / PAGE_SIZE) || 0;
  const pageItems = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const setQueryAndResetPage = (value) => {
    setQuery(value);
    setPage(0);
  };

  const toggleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => -d);
    } else {
      setSortKey(key);
      setSortDir(-1);
    }
    setPage(0);
  };

  return {
    query,
    setQuery: setQueryAndResetPage,
    sortKey,
    sortDir,
    toggleSort,
    page,
    setPage,
    pageCount,
    pageItems,
    totalCount: sorted.length,
  };
}

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

/**
 * Read-only operational signals dashboard, backed by the platform's hourly sync pipeline
 * (shared-secret gated, same pattern as every other backend-fed page in this app).
 *
 * All sections read from the sync pipeline's derived data, never live production. Nothing on
 * this page writes anything.
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

const SideBySide = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 16px;

  @media (min-width: 900px) {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
`;

const SearchInput = styled(Input)`
  width: 100%;
  margin-bottom: 10px;
`;

const SortRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
`;

const SortButton = styled.button`
  appearance: none;
  border: 1px solid ${(p) => (p.$active ? token.brand : token.line)};
  background: ${(p) => (p.$active ? token.brandSoft : token.surface)};
  color: ${(p) => (p.$active ? token.brandDark : token.ink500)};
  border-radius: ${token.radiusSm};
  padding: 4px 9px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background: ${token.canvas};
  }
`;

const SortArrow = ({ active, dir }) => (active ? (dir === 1 ? " ↑" : " ↓") : "");

const dormancySort = {
  name: (a, b) => a.companyName.localeCompare(b.companyName),
  daysSince: (a, b) => a.daysSinceLastBooking - b.daysSinceLastBooking,
  avgInterval: (a, b) => (a.avgBookingIntervalDays || 0) - (b.avgBookingIntervalDays || 0),
};

const leadsSort = {
  name: (a, b) => a.companyName.localeCompare(b.companyName),
  firstSeen: (a, b) => new Date(a.firstSeenAt) - new Date(b.firstSeenAt),
};

const anomaliesSort = {
  id: (a, b) => a.appointmentId.localeCompare(b.appointmentId),
  stored: (a, b) => a.storedAmount - b.storedAmount,
  recomputed: (a, b) => a.recomputedAmount - b.recomputedAmount,
  difference: (a, b) => Math.abs(a.difference) - Math.abs(b.difference),
};

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

  const dormancy = useSearchSortPage(data?.dormancy, {
    searchFn: (d, q) => d.companyName.toLowerCase().includes(q),
    sortFns: dormancySort,
    defaultSortKey: "daysSince",
  });

  const leads = useSearchSortPage(data?.newLeads, {
    searchFn: (l, q) => l.companyName.toLowerCase().includes(q),
    sortFns: leadsSort,
    defaultSortKey: "firstSeen",
  });

  const anomalies = useSearchSortPage(data?.anomalies, {
    searchFn: (a, q) => a.appointmentId.toLowerCase().includes(q),
    sortFns: anomaliesSort,
    defaultSortKey: "difference",
  });

  return (
    <Page>
      <FontImport />
      <PageHeader
        eyebrow="Operations"
        title="Platform Signals"
        subtitle={
          "A daily health view of companies that may need follow-up, possible data issues, and appointment pricing " +
          "mismatches. This page uses the latest saved system check, so it will not slow down live bookings." +
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
          {/* Dormant companies + New ClinicPlus companies + Pricing anomalies, side by side */}
          <SideBySide>
            <SectionCard>
              <SectionTitle>
                Dormant companies ({dormancy.totalCount}{dormancy.query ? ` of ${data.dormancy?.length || 0}` : ""})
              </SectionTitle>
              <SectionHint>
                Companies quiet for more than 2x their own historical booking interval. Outreach list only —
                nothing here is emailed automatically.
              </SectionHint>
              {!data.dormancy?.length ? (
                <EmptyState title="None flagged" />
              ) : (
                <>
                  <SearchInput
                    placeholder="Search by company name…"
                    value={dormancy.query}
                    onChange={(e) => dormancy.setQuery(e.target.value)}
                  />
                  <SortRow>
                    <SortButton $active={dormancy.sortKey === "name"} onClick={() => dormancy.toggleSort("name")}>
                      Name<SortArrow active={dormancy.sortKey === "name"} dir={dormancy.sortDir} />
                    </SortButton>
                    <SortButton
                      $active={dormancy.sortKey === "daysSince"}
                      onClick={() => dormancy.toggleSort("daysSince")}
                    >
                      Days since<SortArrow active={dormancy.sortKey === "daysSince"} dir={dormancy.sortDir} />
                    </SortButton>
                    <SortButton
                      $active={dormancy.sortKey === "avgInterval"}
                      onClick={() => dormancy.toggleSort("avgInterval")}
                    >
                      Avg interval<SortArrow active={dormancy.sortKey === "avgInterval"} dir={dormancy.sortDir} />
                    </SortButton>
                  </SortRow>
                  {dormancy.pageItems.length === 0 ? (
                    <EmptyState title="No matches" />
                  ) : (
                    <List>
                      {dormancy.pageItems.map((d) => (
                        <Row key={d.companyId}>
                          <RowMain>{d.companyName}</RowMain>
                          <RowMeta>
                            {d.daysSinceLastBooking}d since last booking (avg interval {d.avgBookingIntervalDays}d)
                          </RowMeta>
                        </Row>
                      ))}
                    </List>
                  )}
                  <Pagination page={dormancy.page} pageCount={dormancy.pageCount} onChange={dormancy.setPage} />
                </>
              )}
            </SectionCard>

            <SectionCard>
              <SectionTitle>
                New ClinicPlus companies ({leads.totalCount}{leads.query ? ` of ${data.newLeads?.length || 0}` : ""})
              </SectionTitle>
              {!data.newLeads?.length ? (
                <EmptyState title="None flagged" />
              ) : (
                <>
                  <SearchInput
                    placeholder="Search by company name…"
                    value={leads.query}
                    onChange={(e) => leads.setQuery(e.target.value)}
                  />
                  <SortRow>
                    <SortButton $active={leads.sortKey === "name"} onClick={() => leads.toggleSort("name")}>
                      Name<SortArrow active={leads.sortKey === "name"} dir={leads.sortDir} />
                    </SortButton>
                    <SortButton
                      $active={leads.sortKey === "firstSeen"}
                      onClick={() => leads.toggleSort("firstSeen")}
                    >
                      First seen<SortArrow active={leads.sortKey === "firstSeen"} dir={leads.sortDir} />
                    </SortButton>
                  </SortRow>
                  {leads.pageItems.length === 0 ? (
                    <EmptyState title="No matches" />
                  ) : (
                    <List>
                      {leads.pageItems.map((l) => (
                        <Row key={l.companyId}>
                          <RowMain>{l.companyName}</RowMain>
                          <RowMeta>first seen {moment(l.firstSeenAt).format("D MMM YYYY")}</RowMeta>
                        </Row>
                      ))}
                    </List>
                  )}
                  <Pagination page={leads.page} pageCount={leads.pageCount} onChange={leads.setPage} />
                </>
              )}
            </SectionCard>

            <SectionCard style={{ gridColumn: "1 / -1" }}>
              <SectionTitle>
                Pricing anomalies ({anomalies.totalCount}{anomalies.query ? ` of ${data.anomalies?.length || 0}` : ""})
              </SectionTitle>
              <SectionHint>
                Appointments whose stored payment amount doesn't match what recomputing the booking price
                produces. Directly actionable — click through to investigate a specific appointment.
              </SectionHint>
              {!data.anomalies?.length ? (
                <EmptyState title="No mismatches between stored and recomputed pricing" />
              ) : (
                <>
                  <SearchInput
                    placeholder="Search by appointment ID…"
                    value={anomalies.query}
                    onChange={(e) => anomalies.setQuery(e.target.value)}
                  />
                  <SortRow>
                    <SortButton $active={anomalies.sortKey === "id"} onClick={() => anomalies.toggleSort("id")}>
                      ID<SortArrow active={anomalies.sortKey === "id"} dir={anomalies.sortDir} />
                    </SortButton>
                    <SortButton
                      $active={anomalies.sortKey === "difference"}
                      onClick={() => anomalies.toggleSort("difference")}
                    >
                      Diff<SortArrow active={anomalies.sortKey === "difference"} dir={anomalies.sortDir} />
                    </SortButton>
                    <SortButton
                      $active={anomalies.sortKey === "stored"}
                      onClick={() => anomalies.toggleSort("stored")}
                    >
                      Stored<SortArrow active={anomalies.sortKey === "stored"} dir={anomalies.sortDir} />
                    </SortButton>
                    <SortButton
                      $active={anomalies.sortKey === "recomputed"}
                      onClick={() => anomalies.toggleSort("recomputed")}
                    >
                      Recomputed<SortArrow active={anomalies.sortKey === "recomputed"} dir={anomalies.sortDir} />
                    </SortButton>
                  </SortRow>
                  {anomalies.pageItems.length === 0 ? (
                    <EmptyState title="No matches" />
                  ) : (
                    <List>
                      {anomalies.pageItems.map((a) => (
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
                  <Pagination page={anomalies.page} pageCount={anomalies.pageCount} onChange={anomalies.setPage} />
                </>
              )}
            </SectionCard>
          </SideBySide>

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

        </>
      )}
    </Page>
  );
};

export default Signals;
