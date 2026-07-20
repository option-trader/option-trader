// Moving averages, MA-crossover pattern detection, and confidence scoring.

/**
 * Simple moving average over candle closes.
 * Returns an array of { time, value } aligned to candles, starting at index period-1.
 */
export function sma(candles, period) {
  const out = [];
  if (candles.length < period) return out;
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) {
      out.push({ time: candles[i].time, value: round2(sum / period) });
    }
  }
  return out;
}

/**
 * Latest MA value (or null).
 */
export function lastMA(maSeries) {
  return maSeries.length ? maSeries[maSeries.length - 1].value : null;
}

/**
 * Detect MA crossover signals across the full history.
 * fast crossing ABOVE slow => BUY, crossing BELOW => SELL.
 * Returns array of { time, type: 'BUY'|'SELL', price, confidence }.
 */
export function detectSignals(candles, fastPeriod = 50, slowPeriod = 200) {
  const signals = [];
  if (candles.length < slowPeriod + 1) return signals;

  const fast = sma(candles, fastPeriod);
  const slow = sma(candles, slowPeriod);

  // Index both MAs by time for alignment.
  const fastByTime = new Map(fast.map((p) => [p.time, p.value]));
  const slowByTime = new Map(slow.map((p) => [p.time, p.value]));

  let prevDiff = null;
  for (let i = 0; i < candles.length; i++) {
    const t = candles[i].time;
    const f = fastByTime.get(t);
    const s = slowByTime.get(t);
    if (f == null || s == null) continue;
    const diff = f - s;
    if (prevDiff !== null) {
      if (prevDiff <= 0 && diff > 0) {
        signals.push({
          time: t,
          type: "BUY",
          price: candles[i].close,
          confidence: confidence(diff, s, prevDiff),
        });
      } else if (prevDiff >= 0 && diff < 0) {
        signals.push({
          time: t,
          type: "SELL",
          price: candles[i].close,
          confidence: confidence(diff, s, prevDiff),
        });
      }
    }
    prevDiff = diff;
  }
  return signals;
}

/**
 * Confidence 0-100 based on the strength of the cross:
 * how large the new separation is relative to price, plus the momentum of
 * the crossing (how fast diff swung through zero).
 */
function confidence(diff, slowValue, prevDiff) {
  const separation = Math.abs(diff) / (slowValue || 1); // fractional gap
  const momentum = Math.abs(diff - prevDiff) / (slowValue || 1);
  const raw = separation * 4000 + momentum * 6000;
  return Math.round(clamp(40 + raw, 0, 100));
}

/**
 * The most recent signal at or before the latest candle, if the fast/slow
 * relationship indicates a live directional bias. Used by the auto trader.
 */
export function latestSignal(candles, fastPeriod = 50, slowPeriod = 200) {
  const signals = detectSignals(candles, fastPeriod, slowPeriod);
  return signals.length ? signals[signals.length - 1] : null;
}

function round2(v) {
  return Math.round(v * 100) / 100;
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
