// SENSEX index mock data generator.
// SENSEX trades around 80,000 base price with similar volatility to Nifty.

export const SENSEX = {
  symbol: "SENSEX",
  name: "BSE SENSEX",
  base: 80000,
  tick: 0.5,
};

/**
 * Generate SENSEX candles with realistic price movement.
 * Returns array of candle objects: { time, open, high, low, close, volume }
 */
export function generateSensexCandles(count = 12600) {
  const candles = [];
  let price = SENSEX.base;
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * 60; // 1-minute intervals

    // Random walk with slight mean reversion
    const drift = (SENSEX.base - price) * 0.0001;
    const volatility = SENSEX.tick * (0.8 + Math.random() * 0.4);
    const change = drift + (Math.random() - 0.5) * volatility * 2;

    const open = price;
    price = Math.max(price + change, SENSEX.base * 0.9);
    price = Math.min(price, SENSEX.base * 1.1);

    const high = Math.max(open, price) + Math.random() * volatility;
    const low = Math.min(open, price) - Math.random() * volatility;
    const close = price;
    const volume = Math.floor(50000 + Math.random() * 150000);

    candles.push({ time, open, high, low, close, volume });
  }

  return candles;
}

/**
 * Generate a single SENSEX tick (for live updates).
 */
export function sensexTick(lastPrice) {
  const drift = (SENSEX.base - lastPrice) * 0.0002;
  const volatility = SENSEX.tick * 1.5;
  const change = drift + (Math.random() - 0.5) * volatility * 2;
  return Math.max(lastPrice + change, SENSEX.base * 0.9);
}
