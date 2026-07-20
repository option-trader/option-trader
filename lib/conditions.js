// User-defined condition engine + preset patterns.
// A strategy = { buy: Condition, sell: Condition, preset }
// Condition types:
//   { type: 'price', op: 'at'|'above'|'below', level: 1650 }
//   { type: 'ma',    op: 'at'|'above'|'below', period: 50|200 }   // price vs MA
//   { type: 'ma-cross' }        // MA50 x MA200 (preset)
//   { type: 'breakout' }        // price breaks N-candle high/low (preset)
//   { type: 'rsi', level: 30 }  // RSI14 threshold (preset)
//   { type: 'volume' }          // volume spike (preset)
// `confidence` (0-100) controls how strict the 'at' tolerance band is.

import { sma } from "./indicators.js";

export const PRESETS = [
  { key: "custom", label: "Custom (price levels)" },
  { key: "ma-cross", label: "MA Crossover (50 × 200)" },
  { key: "breakout", label: "Support/Resistance breakout" },
  { key: "rsi", label: "RSI Overbought/Oversold" },
  { key: "volume", label: "Volume spike" },
];

export function rsi(candles, period = 14) {
  if (candles.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  const start = candles.length - period - 1;
  for (let i = start + 1; i < candles.length; i++) {
    const d = candles[i].close - candles[i - 1].close;
    if (d > 0) gain += d;
    else loss -= d;
  }
  if (loss === 0) return 100;
  const rs = gain / loss;
  return Math.round((100 - 100 / (1 + rs)) * 10) / 10;
}

/** Human-readable description for the activity log / UI. */
export function describeCondition(cond, side) {
  const inr = (v) => "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const opTxt = { at: "hits", above: "≥", below: "≤" };
  switch (cond.type) {
    case "price":
      return `Price ${opTxt[cond.op]} ${inr(cond.level)}`;
    case "ma":
      return `Price ${opTxt[cond.op]} MA${cond.period}`;
    case "ma-cross":
      return side === "BUY" ? "MA50 crosses above MA200" : "MA50 crosses below MA200";
    case "breakout":
      return side === "BUY" ? "Break above 50-candle high" : "Break below 50-candle low";
    case "rsi":
      return side === "BUY" ? `RSI14 < ${cond.level ?? 30} (oversold)` : `RSI14 > ${cond.level ?? 70} (overbought)`;
    case "volume":
      return side === "BUY" ? "Volume spike on green candle" : "Volume spike on red candle";
    default:
      return "—";
  }
}

/**
 * Stateful evaluator: call check() every tick.
 * Tracks previous values so 'at' and cross conditions trigger on the
 * transition, not continuously while the condition stays true.
 */
export class StrategyWatcher {
  constructor(strategy) {
    this.strategy = strategy; // { buy, sell, confidence }
    this.prevPrice = null;
    this.prevMaDiff = null;
    this.armed = { BUY: true, SELL: true };
    // edge-trigger memory: a side only fires on the false→true transition,
    // so "price above X" doesn't refire on every tick while it stays true
    this.lastEval = { BUY: false, SELL: false };
  }

  /** tolerance band for 'at' — stricter confidence = tighter band */
  _tol(level) {
    const conf = this.strategy.confidence ?? 80;
    return level * (0.0005 + ((100 - conf) / 100) * 0.004); // 0.05% .. 0.45%
  }

  /**
   * @param ctx { price, candles }  candles = finalized candles for the active timeframe
   * @returns 'BUY' | 'SELL' | null
   */
  check(ctx) {
    const buyNow = this._evalSide(this.strategy.buy, "BUY", ctx);
    const sellNow = this._evalSide(this.strategy.sell, "SELL", ctx);
    const buyHit = this.armed.BUY && buyNow && !this.lastEval.BUY;
    const sellHit = !buyHit && this.armed.SELL && sellNow && !this.lastEval.SELL;
    this.lastEval = { BUY: buyNow, SELL: sellNow };
    this._updatePrev(ctx);
    if (buyHit) return "BUY";
    if (sellHit) return "SELL";
    return null;
  }

  /** re-arm a side after its trigger has been consumed (or dismissed) */
  rearm(side) {
    this.armed[side] = true;
  }
  disarm(side) {
    this.armed[side] = false;
  }

  _updatePrev(ctx) {
    this.prevPrice = ctx.price;
    if (this.strategy.buy?.type === "ma-cross" || this.strategy.sell?.type === "ma-cross") {
      const { candles } = ctx;
      const f = sma(candles, 50);
      const s = sma(candles, 200);
      if (f.length && s.length) {
        this.prevMaDiff = f[f.length - 1].value - s[s.length - 1].value;
      }
    }
  }

  _evalSide(cond, side, ctx) {
    if (!cond) return false;
    const { price, candles } = ctx;

    switch (cond.type) {
      case "price":
        return this._priceOp(cond.op, price, +cond.level, side);

      case "ma": {
        const series = sma(candles, +cond.period || 50);
        if (!series.length) return false;
        return this._priceOp(cond.op, price, series[series.length - 1].value, side);
      }

      case "ma-cross": {
        const f = sma(candles, 50);
        const s = sma(candles, 200);
        if (!f.length || !s.length || this.prevMaDiff == null) return false;
        const diff = f[f.length - 1].value - s[s.length - 1].value;
        if (side === "BUY") return this.prevMaDiff <= 0 && diff > 0;
        return this.prevMaDiff >= 0 && diff < 0;
      }

      case "breakout": {
        const look = candles.slice(-51, -1); // last 50 finalized candles
        if (look.length < 20) return false;
        if (side === "BUY") {
          const high = Math.max(...look.map((c) => c.high));
          return this.prevPrice != null && this.prevPrice <= high && price > high;
        }
        const low = Math.min(...look.map((c) => c.low));
        return this.prevPrice != null && this.prevPrice >= low && price < low;
      }

      case "rsi": {
        const r = rsi(candles, 14);
        if (r == null) return false;
        if (side === "BUY") return r < (cond.level ?? 30);
        return r > (cond.level ?? 70);
      }

      case "volume": {
        if (candles.length < 21) return false;
        const last = candles[candles.length - 1];
        const avg = candles.slice(-21, -1).reduce((s2, c) => s2 + (c.volume || 0), 0) / 20;
        const spike = (last.volume || 0) > avg * 2.5;
        if (!spike) return false;
        if (side === "BUY") return last.close > last.open;
        return last.close < last.open;
      }

      default:
        return false;
    }
  }

  _priceOp(op, price, level, side) {
    if (!level || !isFinite(level)) return false;
    switch (op) {
      case "above":
        return price >= level;
      case "below":
        return price <= level;
      case "at": {
        if (this.prevPrice == null) return false;
        const tol = this._tol(level);
        // BUY fires only on upward cross or landing on the level
        // SELL fires only on downward cross or landing on the level
        if (side === "BUY") {
          return (this.prevPrice < level && price >= level) || Math.abs(price - level) <= tol;
        }
        return (this.prevPrice > level && price <= level) || Math.abs(price - level) <= tol;
      }
      default:
        return false;
    }
  }
}

/** Build the default strategy object for a preset key. */
export function strategyForPreset(key, currentPrice) {
  const p = currentPrice || 1000;
  switch (key) {
    case "ma-cross":
      return { buy: { type: "ma-cross" }, sell: { type: "ma-cross" } };
    case "breakout":
      return { buy: { type: "breakout" }, sell: { type: "breakout" } };
    case "rsi":
      return { buy: { type: "rsi", level: 30 }, sell: { type: "rsi", level: 70 } };
    case "volume":
      return { buy: { type: "volume" }, sell: { type: "volume" } };
    case "custom":
    default:
      return {
        buy: { type: "price", op: "at", level: round2(p * 0.99) },
        sell: { type: "price", op: "at", level: round2(p * 1.01) },
      };
  }
}

function round2(v) {
  return Math.round(v * 100) / 100;
}
