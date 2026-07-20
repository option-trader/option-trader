// Client-side market data source with automatic fallback.
// In upstox mode it polls /api/market/quote every second; if the API is
// unavailable (demo mode, market closed, token expired, network error) it
// reports source "simulator" and the dashboard keeps using MarketSimulator.
// Prices from Upstox are fed INTO each stock's simulator so candle building,
// MAs and SL/TP monitoring work identically for both sources.

const FAILURES_BEFORE_FALLBACK = 3;
const RETRY_LIVE_AFTER_MS = 60_000;

export class MarketDataSource {
  constructor() {
    this.mode = "simulator"; // "upstox" | "simulator"
    this.enabled = false; // becomes true when session mode is upstox
    this.failures = 0;
    this.lastAttempt = 0;
    this.inFlight = false;
    this.onSourceChange = null; // callback(mode)
  }

  enableLive() {
    this.enabled = true;
  }

  _setMode(mode) {
    if (this.mode !== mode) {
      this.mode = mode;
      this.onSourceChange?.(mode);
    }
  }

  // Called from the 1s tick loop. Returns { SYMBOL: ltp } from Upstox, or
  // null meaning "use the simulator this tick".
  async poll(symbols) {
    if (!this.enabled || this.inFlight) return null;

    const now = Date.now();
    // after repeated failures, only re-try live once a minute
    if (this.failures >= FAILURES_BEFORE_FALLBACK && now - this.lastAttempt < RETRY_LIVE_AFTER_MS) {
      return null;
    }
    this.lastAttempt = now;
    this.inFlight = true;
    try {
      const res = await fetch(`/api/market/quote?symbols=${symbols.join(",")}`);
      if (res.status === 401) {
        // token expired — stop trying, let the UI prompt re-login
        this.enabled = false;
        this._setMode("simulator");
        this.onAuthExpired?.();
        return null;
      }
      if (!res.ok) throw new Error(`quote ${res.status}`);
      const data = await res.json();
      this.failures = 0;
      this._setMode("upstox");
      const out = {};
      for (const [sym, q] of Object.entries(data.quotes || {})) {
        if (typeof q.ltp === "number" && q.ltp > 0) out[sym] = q.ltp;
      }
      return out;
    } catch {
      this.failures += 1;
      if (this.failures >= FAILURES_BEFORE_FALLBACK) this._setMode("simulator");
      return null;
    } finally {
      this.inFlight = false;
    }
  }
}
