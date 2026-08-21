import { adminApi } from "./adminApi";

function unavailableControl(key) {
  return {
    key,
    enabled: true,
    publicMessage: "Platform controls are temporarily unavailable. Please try again in a moment.",
  };
}

export async function getBlockingPlatformControl(key) {
  const data = await adminApi("/api/admin/platform-controls");
  return (data.controls || []).find((control) => control.key === key && control.enabled) || null;
}

export async function getBlockingPlatformControlOrFallback(key) {
  try {
    return await getBlockingPlatformControl(key);
  } catch {
    return unavailableControl(key);
  }
}

export function platformControlMessage(control, fallback) {
  return control?.publicMessage || control?.reason || fallback || "This action is temporarily disabled.";
}
