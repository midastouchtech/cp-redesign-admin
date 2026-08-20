const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

export async function adminApi(path, options = {}) {
  if (!COMPANION_API_URL) {
    throw new Error("REACT_APP_COMPANION_API_URL is not configured");
  }
  const headers = {
    "Content-Type": "application/json",
    ...(COMPANION_STATS_SECRET ? { "x-admin-stats-secret": COMPANION_STATS_SECRET } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${COMPANION_API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function publicCompanionUrl(path) {
  return `${COMPANION_API_URL || ""}${path}`;
}
