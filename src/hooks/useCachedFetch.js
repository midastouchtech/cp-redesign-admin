import { useCallback, useEffect, useRef, useState } from "react";

const CACHE_PREFIX = "cp_admin_cache:";

const readCache = (key) => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = (key, data) => {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, cachedAt: Date.now() })
    );
  } catch {
    // localStorage full or unavailable (private browsing) — cache is best-effort only
  }
};

/**
 * Loads a cached value from localStorage instantly (so the page never shows a blank/loading
 * state on repeat visits), then always re-fetches in the background to replace it with fresh
 * data — the cache is a "show something now" layer, never a substitute for a real request.
 *
 * `key` should be unique per distinct query (e.g. include type/date params) so switching
 * parameters doesn't show stale data from a different query while the new one loads.
 */
export function useCachedFetch(key, fetcher, { enabled = true } = {}) {
  const cached = enabled ? readCache(key) : null;
  const [data, setData] = useState(cached?.data ?? null);
  const [cachedAt, setCachedAt] = useState(cached?.cachedAt ?? null);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(!!cached);
  const [error, setError] = useState(null);
  const lastKey = useRef(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    const isFirstLoadForKey = lastKey.current !== key;
    lastKey.current = key;

    const existing = readCache(key);
    if (existing && isFirstLoadForKey) {
      setData(existing.data);
      setCachedAt(existing.cachedAt);
      setLoading(false);
      setRefreshing(true);
    } else if (!existing) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const fresh = await fetcher();
      setData(fresh);
      setCachedAt(Date.now());
      writeCache(key, fresh);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [key, fetcher, enabled]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return { data, loading, refreshing, error, cachedAt, refetch: load };
}
