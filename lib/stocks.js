// Hardcoded Nifty 50 universe with realistic base prices (₹).
// Prices are only starting points — the simulator random-walks from here.
// `isin` gives the Upstox instrument key: `NSE_EQ|<isin>`.
export const STOCKS = [
  { symbol: "TCS", name: "Tata Consultancy Services", base: 3850, tick: 0.9, isin: "INE467B01029" },
  { symbol: "INFY", name: "Infosys", base: 1560, tick: 1.0, isin: "INE009A01021" },
  { symbol: "HDFCBANK", name: "HDFC Bank", base: 1680, tick: 0.8, isin: "INE040A01034" },
  { symbol: "RELIANCE", name: "Reliance Industries", base: 2950, tick: 0.9, isin: "INE002A01018" },
  { symbol: "ICICIBANK", name: "ICICI Bank", base: 1180, tick: 0.9, isin: "INE090A01021" },
  { symbol: "SBIN", name: "State Bank of India", base: 830, tick: 1.1, isin: "INE062A01020" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", base: 1440, tick: 0.9, isin: "INE397D01024" },
  { symbol: "ITC", name: "ITC", base: 445, tick: 1.2, isin: "INE154A01025" },
  { symbol: "LT", name: "Larsen & Toubro", base: 3620, tick: 0.9, isin: "INE018A01030" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", base: 1790, tick: 0.8, isin: "INE237A01028" },
  { symbol: "AXISBANK", name: "Axis Bank", base: 1160, tick: 1.0, isin: "INE238A01034" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", base: 2480, tick: 0.7, isin: "INE030A01027" },
  { symbol: "WIPRO", name: "Wipro", base: 530, tick: 1.2, isin: "INE075A01022" },
  { symbol: "MARUTI", name: "Maruti Suzuki", base: 12800, tick: 0.7, isin: "INE585B01010" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", base: 1720, tick: 0.9, isin: "INE044A01036" },
];

export const STOCK_MAP = Object.fromEntries(STOCKS.map((s) => [s.symbol, s]));

export function getStock(symbol) {
  return STOCK_MAP[symbol] || STOCKS[0];
}

// Upstox instrument key, e.g. "NSE_EQ|INE009A01021"
export function instrumentKey(symbol) {
  const s = STOCK_MAP[symbol];
  return s ? `NSE_EQ|${s.isin}` : null;
}

export function symbolForInstrumentKey(key) {
  const isin = String(key).split("|")[1];
  return STOCKS.find((s) => s.isin === isin)?.symbol || null;
}
