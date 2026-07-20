// localStorage persistence helpers (SSR-safe).
const PREFIX = "atb:";

function ls() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadJSON(key, fallback = null) {
  const s = ls();
  if (!s) return fallback;
  try {
    const raw = s.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  const s = ls();
  if (!s) return;
  try {
    s.setItem(PREFIX + key, JSON.stringify(value));
  } catch {}
}

export function removeKey(key) {
  const s = ls();
  if (!s) return;
  try {
    s.removeItem(PREFIX + key);
  } catch {}
}

// per-stock strategy settings
export const stockSettingsKey = (symbol) => `settings:${symbol}`;
// closed trades + capital snapshot
export const TRADES_KEY = "trades";
// UI prefs (timeframe, MA overlay, mode)
export const PREFS_KEY = "prefs";
