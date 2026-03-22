const ADMIN_STORAGE_KEY = "kar_admin_access_key_v1";

export function readAdminKey() {
  if (typeof window === "undefined") return "";
  try {
    return String(window.sessionStorage.getItem(ADMIN_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function saveAdminKey(value) {
  if (typeof window === "undefined") return;
  const key = String(value || "").trim();
  try {
    if (key) window.sessionStorage.setItem(ADMIN_STORAGE_KEY, key);
    else window.sessionStorage.removeItem(ADMIN_STORAGE_KEY);
  } catch {
    // Non-critical client storage path.
  }
}

export function clearAdminKey() {
  saveAdminKey("");
}

export function isAdminRoute(path = "") {
  return String(path || "").startsWith("/admin/");
}
