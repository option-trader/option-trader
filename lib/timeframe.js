// Aggregate 1-minute base candles into higher timeframes.

export const TIMEFRAMES = [
  { key: "1m", label: "1min", minutes: 1 },
  { key: "5m", label: "5min", minutes: 5 },
  { key: "15m", label: "15min", minutes: 15 },
  { key: "1h", label: "1hour", minutes: 60 },
];

/**
 * Buckets 1-min candles into `minutes`-wide candles.
 * The last (possibly partial) bucket is included so the chart shows the
 * forming higher-timeframe candle live.
 */
export function aggregate(candles1m, minutes) {
  if (minutes <= 1) return candles1m;
  const span = minutes * 60;
  const out = [];
  let bucket = null;
  for (const c of candles1m) {
    const bucketTime = Math.floor(c.time / span) * span;
    if (!bucket || bucket.time !== bucketTime) {
      if (bucket) out.push(bucket);
      bucket = { time: bucketTime, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume || 0 };
    } else {
      bucket.high = Math.max(bucket.high, c.high);
      bucket.low = Math.min(bucket.low, c.low);
      bucket.close = c.close;
      bucket.volume += c.volume || 0;
    }
  }
  if (bucket) out.push(bucket);
  return out;
}
