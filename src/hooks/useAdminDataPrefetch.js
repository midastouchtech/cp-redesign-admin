import { useEffect, useRef } from "react";
import moment from "moment";

const CACHE_PREFIX = "cp_admin_cache:";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

const writeCache = (key, data) => {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, cachedAt: Date.now() }));
  } catch {
    // localStorage full or unavailable — best-effort only, same as useCachedFetch
  }
};

const authedFetch = async (path) => {
  const res = await fetch(`${COMPANION_API_URL}${path}`, {
    headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET },
  });
  if (!res.ok) throw new Error(`${path} failed (${res.status})`);
  return res.json();
};

/**
 * Prefetches the "default view" of every backend-backed admin page (Dashboard, Analytics,
 * Employees, Availability, Messaging) as soon as the admin is known, and keeps refetching on a
 * 5-minute interval regardless of which page is currently open — writes straight into the same
 * localStorage keys useCachedFetch reads (cp_admin_cache:<key>), so no page needs to change how
 * it fetches its own data. This turns "first visit to a page this session" from a network wait
 * into a cache hit, and keeps that cache from going stale even while the admin sits on a
 * different page for a while.
 *
 * Only prefetches each page's default/no-filter view (page 0, no search term, current month,
 * first clinic) — a page's own search/filter results are still fetched on demand by that page's
 * useCachedFetch call, same as before. This isn't full request-level caching, just warming the
 * handful of queries an admin almost always hits first.
 *
 * Mount this once, inside Layout, once `user` is known (adminType is needed to build the right
 * dashboard/analytics cache key) — do not mount it per-page or it'll run one interval per page
 * visited.
 */
export function useAdminDataPrefetch(user) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user || !COMPANION_API_URL || !COMPANION_STATS_SECRET) return;

    const type = user?.details?.adminType === "xrayAdmin" ? "x-rays" : "all";
    const monthKey = moment().format("MMMM");
    const yearKey = moment().format("YYYY");
    const clinic = "Hendrina";
    const availabilityYear = moment().year();
    const availabilityMonth = moment().month() + 1;

    const prefetchAll = async () => {
      const jobs = [
        {
          key: `dashboard-stats:${type}`,
          path: `/api/admin/dashboard-stats?type=${type}`,
        },
        {
          key: `finance-analytics:${type}:${monthKey}:${yearKey}`,
          path: `/api/admin/finance-analytics?date=01-${monthKey}-${yearKey}&type=${type}`,
        },
        {
          key: `admin-employees::0`,
          path: `/api/admin/employees?page=0`,
        },
        {
          key: `admin-availability:${clinic}:${yearKey}-${String(availabilityMonth).padStart(2, "0")}`,
          path: `/api/admin/availability?clinic=${clinic}&year=${availabilityYear}&month=${availabilityMonth}`,
        },
        {
          key: `admin-availability-capacity:${clinic}:${yearKey}-${String(availabilityMonth).padStart(2, "0")}`,
          path: `/api/admin/availability/capacity?clinic=${clinic}&year=${availabilityYear}&month=${availabilityMonth}`,
        },
        {
          key: `admin-messaging-threads:::0`,
          path: `/api/admin/messaging/threads?page=0`,
        },
      ];

      const results = await Promise.allSettled(
        jobs.map(async (job) => {
          const data = await authedFetch(job.path);
          writeCache(job.key, data);
        })
      );

      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length) {
        console.warn(
          "[background prefetch] some queries failed",
          failures.map((f) => f.reason?.message || f.reason)
        );
      }
    };

    prefetchAll();
    intervalRef.current = setInterval(prefetchAll, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.details?.adminType]);
}
