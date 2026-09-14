/*
  Bearer-token session storage.

  Kept deliberately free of React and of the zustand stores so that
  apiClient.js can read the token without importing anything that imports
  apiClient.js back. The auth store subscribes to this module instead.
*/

const STORAGE_KEY = "octatrade.session.token";

let token = null;
let hydrated = false;
const listeners = new Set();

function readStorage() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private mode / blocked storage: the session simply stays in memory.
    return null;
  }
}

function writeStorage(value) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Non-fatal: session degrades to memory-only for this tab. */
  }
}

/** Reads the persisted token once, then serves from memory. */
export function getToken() {
  if (!hydrated) {
    token = readStorage();
    hydrated = true;
  }
  return token;
}

export function setToken(next) {
  token = next || null;
  hydrated = true;
  writeStorage(token);
  listeners.forEach((listener) => listener(token));
}

export function clearToken() {
  setToken(null);
}

/** Subscribe to token changes. Returns an unsubscribe function. */
export function subscribeToken(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* Cross-tab sign-in/sign-out stays consistent. */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    token = event.newValue;
    hydrated = true;
    listeners.forEach((listener) => listener(token));
  });
}
