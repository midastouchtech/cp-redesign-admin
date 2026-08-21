import { adminApi } from "./adminApi";

const PLATFORM_CONTROLS_EVENT = "clinicplus:platform-controls-updated";
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("clinicplus-platform-controls") : null;
let cachedControls = null;

function unavailableControl(key) {
  return {
    key,
    enabled: true,
    publicMessage: "Platform controls are temporarily unavailable. Please try again in a moment.",
  };
}

function normalizeControls(controls) {
  return Array.isArray(controls) ? controls : [];
}

function emitPlatformControlsUpdate(controls) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PLATFORM_CONTROLS_EVENT, { detail: { controls } }));
  }
  if (channel) {
    channel.postMessage({ controls });
  }
}

export function setCachedPlatformControls(controls, options = {}) {
  cachedControls = normalizeControls(controls);
  if (options.broadcast !== false) {
    emitPlatformControlsUpdate(cachedControls);
  }
  return cachedControls;
}

export function getCachedPlatformControls() {
  return cachedControls;
}

export function findBlockingPlatformControl(controls, key) {
  return normalizeControls(controls).find((control) => control.key === key && control.enabled) || null;
}

export function subscribeToPlatformControls(callback) {
  const handleWindowUpdate = (event) => callback(normalizeControls(event.detail?.controls));
  const handleChannelUpdate = (event) => {
    if (event.data?.controls) {
      cachedControls = normalizeControls(event.data.controls);
      callback(cachedControls);
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener(PLATFORM_CONTROLS_EVENT, handleWindowUpdate);
  }
  if (channel) {
    channel.addEventListener("message", handleChannelUpdate);
  }

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener(PLATFORM_CONTROLS_EVENT, handleWindowUpdate);
    }
    if (channel) {
      channel.removeEventListener("message", handleChannelUpdate);
    }
  };
}

export async function fetchPlatformControls() {
  const data = await adminApi("/api/admin/platform-controls");
  return setCachedPlatformControls(data.controls || [], { broadcast: false });
}

export async function getBlockingPlatformControl(key) {
  const controls = cachedControls || await fetchPlatformControls();
  return findBlockingPlatformControl(controls, key);
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
