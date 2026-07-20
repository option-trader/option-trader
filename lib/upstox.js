// Server-side Upstox v2 API wrappers. All calls take the user's access token
// (from the session cookie) — never call these from the client.
// Docs: https://upstox.com/developer/api-documentation

const BASE = "https://api.upstox.com/v2";

async function upstoxGet(path, accessToken) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.status === "error") {
    const msg = data?.errors?.[0]?.message || data?.message || `Upstox GET ${path} failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data.data;
}

// Last traded price for one or more instrument keys ("NSE_EQ|INE009A01021").
// Returns { [instrumentKey]: { last_price, instrument_token, ... } }
export async function getLtp(instrumentKeys, accessToken) {
  const keys = Array.isArray(instrumentKeys) ? instrumentKeys : [instrumentKeys];
  return upstoxGet(`/market-quote/ltp?instrument_key=${encodeURIComponent(keys.join(","))}`, accessToken);
}

// Full quote: OHLC, depth, volume.
export async function getFullQuote(instrumentKeys, accessToken) {
  const keys = Array.isArray(instrumentKeys) ? instrumentKeys : [instrumentKeys];
  return upstoxGet(`/market-quote/quotes?instrument_key=${encodeURIComponent(keys.join(","))}`, accessToken);
}

// Historical candles. interval: "1minute" | "30minute" | "day" | "week" | "month".
// Dates are "YYYY-MM-DD". Returns [[timestamp, open, high, low, close, volume, oi], ...] newest-first.
export async function getHistoricalCandles(instrumentKey, interval, toDate, fromDate, accessToken) {
  const path = `/historical-candle/${encodeURIComponent(instrumentKey)}/${interval}/${toDate}/${fromDate}`;
  const data = await upstoxGet(path, accessToken);
  return data?.candles || [];
}

// Intraday candles for the current day. interval: "1minute" | "30minute".
export async function getIntradayCandles(instrumentKey, interval, accessToken) {
  const data = await upstoxGet(`/historical-candle/intraday/${encodeURIComponent(instrumentKey)}/${interval}`, accessToken);
  return data?.candles || [];
}

// User profile — also serves as a cheap token-validity check.
export async function getProfile(accessToken) {
  return upstoxGet("/user/profile", accessToken);
}

// Funds and margin.
export async function getFunds(accessToken) {
  return upstoxGet("/user/get-funds-and-margin", accessToken);
}

// ---- Orders (v2 LIVE trading — gated behind the live-mode toggle in v2) ----

export async function placeOrder(order, accessToken) {
  // order: { instrument_token, quantity, price, order_type, transaction_type, product, validity, ... }
  const res = await fetch(`${BASE}/order/place`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      validity: "DAY",
      product: "I", // intraday
      disclosed_quantity: 0,
      trigger_price: 0,
      is_amo: false,
      ...order,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.status === "error") {
    throw new Error(data?.errors?.[0]?.message || "Order placement failed");
  }
  return data.data; // { order_id }
}

export async function cancelOrder(orderId, accessToken) {
  const res = await fetch(`${BASE}/order/cancel?order_id=${encodeURIComponent(orderId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  const data = await res.json();
  if (!res.ok || data.status === "error") {
    throw new Error(data?.errors?.[0]?.message || "Order cancel failed");
  }
  return data.data;
}

export async function getOrderBook(accessToken) {
  return upstoxGet("/order/retrieve-all", accessToken);
}
