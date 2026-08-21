const KEY = "cp_admin_recent_entities";
const MAX_ITEMS = 12;
const EVENT_NAME = "cp:recent-entities-changed";

export function readRecentEntities() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function notifyRecentEntitiesChanged() {
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeToRecentEntities(callback) {
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

export function rememberEntity(entity) {
  if (!entity?.id || !entity?.type || !entity?.label || !entity?.to) return;
  const next = [
    { ...entity, openedAt: new Date().toISOString() },
    ...readRecentEntities().filter((item) => !(item.type === entity.type && item.id === entity.id)),
  ].slice(0, MAX_ITEMS);
  localStorage.setItem(KEY, JSON.stringify(next));
  notifyRecentEntitiesChanged();
}
