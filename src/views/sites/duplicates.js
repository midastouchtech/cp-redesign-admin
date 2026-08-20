import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import {
  FontImport,
  Page,
  PageHeader,
  StatusMessage,
  EmptyState,
  Button,
  token,
} from "../../components/ListPage";
import { useCachedFetch } from "../../hooks/useCachedFetch";

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

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

const FlagCard = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  padding: 16px 18px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const SiteCol = styled.div`
  flex: 1 1 200px;
  min-width: 180px;
`;

const SiteName = styled.p`
  font-family: "Figtree", sans-serif;
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 4px;
`;

const SiteMeta = styled.p`
  font-size: 12px;
  color: ${token.ink500};
  margin: 0;
`;

const ScoreBadge = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  background: ${token.warningSoft};
  color: ${token.warning};
  white-space: nowrap;
`;

const ActionCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 0 0 auto;
`;

// Admin id used to attribute merge/dismiss actions — this page has no dedicated admin-identity
// concept of its own, so falls back to the same "who is logged in" source the rest of the app
// uses if available, else a generic label the backend just stores as-is.
const getAdminId = () => {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.id || parsed?._id || parsed?.details?.email || "admin";
    }
  } catch {
    // ignore
  }
  return "admin";
};

const SiteDuplicates = () => {
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  const fetcher = useMemo(
    () => async () => {
      const res = await fetch(`${COMPANION_API_URL}/api/admin/sites/duplicates`, {
        headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET },
      });
      if (!res.ok) throw new Error(`Failed to load duplicates (${res.status})`);
      return res.json();
    },
    []
  );

  const { data, loading, error, refetch } = useCachedFetch("admin-sites-duplicates", fetcher);

  const flags = (data?.duplicates || []).filter((f) => !dismissedIds.has(f._id));

  const handleMerge = async (flag, keepSite, mergeSite) => {
    setBusyId(flag._id);
    setActionError(null);
    try {
      const res = await fetch(`${COMPANION_API_URL}/api/admin/sites/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-stats-secret": COMPANION_STATS_SECRET,
        },
        body: JSON.stringify({
          keepSiteId: keepSite._id,
          mergeSiteId: mergeSite._id,
          adminId: getAdminId(),
        }),
      });
      if (!res.ok) throw new Error(`Merge failed (${res.status})`);
      setDismissedIds((prev) => new Set(prev).add(flag._id));
      refetch();
    } catch (err) {
      setActionError(err.message || String(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDismiss = async (flag) => {
    setBusyId(flag._id);
    setActionError(null);
    try {
      const res = await fetch(`${COMPANION_API_URL}/api/admin/sites/duplicates/${flag._id}/dismiss`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-stats-secret": COMPANION_STATS_SECRET,
        },
        body: JSON.stringify({ adminId: getAdminId() }),
      });
      if (!res.ok) throw new Error(`Dismiss failed (${res.status})`);
      setDismissedIds((prev) => new Set(prev).add(flag._id));
      refetch();
    } catch (err) {
      setActionError(err.message || String(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Page>
      <FontImport />
      <BackLink to="/sites">← Back to sites</BackLink>
      <PageHeader
        eyebrow="Directory"
        title="Duplicate sites review"
        subtitle="Near-duplicate site names flagged automatically — confirm whether each pair is the same worksite."
      />

      {error && <StatusMessage $tone="danger">Failed to load duplicates: {error}</StatusMessage>}
      {actionError && <StatusMessage $tone="danger">{actionError}</StatusMessage>}
      {loading && !data && <StatusMessage>Loading…</StatusMessage>}

      {data && flags.length === 0 && (
        <EmptyState title="No pending duplicates" subtitle="Nothing is currently flagged for review." />
      )}

      {flags.map((flag) => {
        const { siteA, siteB } = flag;
        const busy = busyId === flag._id;
        return (
          <FlagCard key={flag._id}>
            <SiteCol>
              <SiteName>{flag.nameA || siteA?.name || "Unknown"}</SiteName>
              <SiteMeta>{siteA?.appointmentCount ?? 0} appointments</SiteMeta>
            </SiteCol>

            <ScoreBadge>{Math.round((flag.similarityScore || 0) * 100)}% similar</ScoreBadge>

            <SiteCol>
              <SiteName>{flag.nameB || siteB?.name || "Unknown"}</SiteName>
              <SiteMeta>{siteB?.appointmentCount ?? 0} appointments</SiteMeta>
            </SiteCol>

            <ActionCol>
              {siteA && siteB ? (
                <>
                  <Button
                    disabled={busy}
                    onClick={() => handleMerge(flag, siteA, siteB)}
                    title={`Keep "${siteA.name}", merge "${siteB.name}" into it`}
                  >
                    Keep "{siteA.name}"
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() => handleMerge(flag, siteB, siteA)}
                    title={`Keep "${siteB.name}", merge "${siteA.name}" into it`}
                  >
                    Keep "{siteB.name}"
                  </Button>
                </>
              ) : (
                <StatusMessage $tone="danger" style={{ margin: 0 }}>
                  One or both sites no longer exist — merge unavailable.
                </StatusMessage>
              )}
              <Button $variant="ghost" disabled={busy} onClick={() => handleDismiss(flag)}>
                Not a duplicate
              </Button>
            </ActionCol>
          </FlagCard>
        );
      })}
    </Page>
  );
};

export default SiteDuplicates;
