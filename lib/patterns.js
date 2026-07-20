// Candlestick pattern detection utilities.
// Lightweight detection for Hammer, Doji, and Engulfing patterns.

/**
 * Detect hammer pattern: small body at top, long lower shadow (≥2x body),
 * little or no upper shadow. Bullish reversal signal.
 */
export function isHammer(candle, avgBody) {
  const body = Math.abs(candle.close - candle.open);
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  if (body === 0) return false;
  return lowerWick >= body * 2 && upperWick <= body * 0.5 && body <= avgBody * 1.5;
}

/**
 * Detect doji pattern: open ≈ close (body < 10% of range).
 * Indicates indecision.
 */
export function isDoji(candle) {
  const body = Math.abs(candle.close - candle.open);
  const range = candle.high - candle.low;
  if (range === 0) return false;
  return body / range < 0.1;
}

/**
 * Detect bullish engulfing: previous candle is bearish (close < open),
 * current candle is bullish (close > open), current body engulfs previous body.
 */
export function isBullishEngulfing(prev, curr) {
  if (!prev || !curr) return false;
  const prevBearish = prev.close < prev.open;
  const currBullish = curr.close > curr.open;
  if (!prevBearish || !currBullish) return false;
  return curr.open <= prev.close && curr.close >= prev.open;
}

/**
 * Detect bearish engulfing: previous candle is bullish, current is bearish
 * and engulfs the previous body.
 */
export function isBearishEngulfing(prev, curr) {
  if (!prev || !curr) return false;
  const prevBullish = prev.close > prev.open;
  const currBearish = curr.close < curr.open;
  if (!prevBullish || !currBearish) return false;
  return curr.open >= prev.close && curr.close <= prev.open;
}

/**
 * Scan candles for patterns. Returns array of detected patterns.
 * Each pattern: { time, type, text, color }
 */
export function detectPatterns(candles) {
  if (!candles || candles.length < 3) return [];

  const patterns = [];
  // Calculate average body size for hammer detection (over last 20 candles)
  const lookback = Math.min(candles.length, 20);
  const recentCandles = candles.slice(-lookback);
  const avgBody = recentCandles.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / lookback;

  // Scan from index 1 (need previous candle for engulfing)
  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];

    // Only detect on finalized candles (not the last forming one)
    if (i === candles.length - 1) continue;

    // Hammer (bullish)
    if (isHammer(curr, avgBody)) {
      patterns.push({
        time: curr.time,
        type: "HAMMER",
        text: "Hammer",
        color: "#26a69a",
      });
    }

    // Doji
    if (isDoji(curr)) {
      patterns.push({
        time: curr.time,
        type: "DOJI",
        text: "Doji",
        color: "#e0b64a",
      });
    }

    // Bullish Engulfing
    if (isBullishEngulfing(prev, curr)) {
      patterns.push({
        time: curr.time,
        type: "BULL_ENGULF",
        text: "Bull Engulf",
        color: "#26a69a",
      });
    }

    // Bearish Engulfing
    if (isBearishEngulfing(prev, curr)) {
      patterns.push({
        time: curr.time,
        type: "BEAR_ENGULF",
        text: "Bear Engulf",
        color: "#ef5350",
      });
    }
  }

  return patterns;
}
