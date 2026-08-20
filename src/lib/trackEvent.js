import store from "../store";

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;

/**
 * Fire-and-forget audit event tracker.
 *
 * POSTs a JSON audit event to cp-companion's `/api/audit/events` endpoint.
 * This function intentionally does NOT return the underlying fetch promise —
 * callers should NOT (and don't need to) `await` it. Any network/parse error
 * is caught internally and only logged via console.warn. This function never
 * throws, so it's always safe to call inline on a success path without
 * wrapping it in try/catch.
 *
 * If `actorId` / `actorName` / `actorType` are not provided, they're derived
 * from the currently logged-in admin via the Redux store (`store.getState().auth.user`),
 * so this is safe to call from anywhere — including plain modules with no
 * access to props/hooks — while still letting call sites that already have
 * `user` in scope pass explicit actor info instead.
 *
 * @param {Object} params
 * @param {string} params.entityType - e.g. 'appointment' | 'user' | 'company'
 * @param {string|number} params.entityId
 * @param {string} params.action - e.g. 'created' | 'updated' | 'status_changed' | 'approved' |
 *   'declined' | 'cancelled' | 'deleted' | 'message_sent' | 'login' | 'manager_added' |
 *   'manager_removed' | 'field_changed'
 * @param {string|number} [params.actorId]
 * @param {string} [params.actorName]
 * @param {string} [params.actorType]
 * @param {Array<{field: string, before: any, after: any}>} [params.changes]
 * @param {Object} [params.metadata]
 */
export function trackEvent({
  entityType,
  entityId,
  action,
  actorId,
  actorName,
  actorType,
  changes,
  metadata,
}) {
  try {
    let resolvedActorId = actorId;
    let resolvedActorName = actorName;
    let resolvedActorType = actorType;

    if (resolvedActorId === undefined || resolvedActorName === undefined || resolvedActorType === undefined) {
      const user = store.getState()?.auth?.user;
      if (resolvedActorType === undefined) resolvedActorType = "admin";
      if (resolvedActorId === undefined) resolvedActorId = user?.id;
      if (resolvedActorName === undefined) {
        resolvedActorName = `${user?.details?.name || ""} ${user?.details?.surname || ""}`.trim();
      }
    }

    const body = {
      source: "cp-redesign-admin",
      entityType,
      entityId,
      action,
      actorId: resolvedActorId,
      actorName: resolvedActorName,
      actorType: resolvedActorType,
    };

    if (changes !== undefined) body.changes = changes;
    if (metadata !== undefined) body.metadata = metadata;

    fetch(`${COMPANION_API_URL}/api/audit/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch((err) => console.warn("[trackEvent] failed", err));
  } catch (err) {
    console.warn("[trackEvent] failed", err);
  }
}

/**
 * Fetches the audit timeline for a single entity.
 *
 * On any failure (network error or non-ok response) this resolves to an
 * empty array rather than throwing/rejecting, so callers can render a safe
 * "no history yet" state without needing their own try/catch.
 *
 * @param {string} entityType
 * @param {string|number} entityId
 * @returns {Promise<Array>} audit events, newest-first (per API contract), or [] on failure
 */
export async function fetchEntityTimeline(entityType, entityId) {
  try {
    const res = await fetch(`${COMPANION_API_URL}/api/audit/entity/${entityType}/${entityId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn("[fetchEntityTimeline] failed", err);
    return [];
  }
}
