// GET /api/market/quote?symbols=INFY,TCS
// Proxies Upstox LTP quotes using the session token. Returns 409 in demo
// mode / when unavailable so the client falls back to the simulator.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getLtp } from "@/lib/upstox";
import { instrumentKey, symbolForInstrumentKey } from "@/lib/stocks";

export async function GET(request) {
  const session = getSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.mode !== "upstox") {
    return NextResponse.json({ error: "Live data unavailable in demo mode", fallback: "simulator" }, { status: 409 });
  }

  const symbols = (request.nextUrl.searchParams.get("symbols") || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 25);
  const keys = symbols.map(instrumentKey).filter(Boolean);
  if (!keys.length) {
    return NextResponse.json({ error: "No valid symbols" }, { status: 400 });
  }

  try {
    const data = await getLtp(keys, session.accessToken);
    // Normalize to { SYMBOL: { ltp } }
    const out = {};
    for (const [key, quote] of Object.entries(data || {})) {
      const sym = symbolForInstrumentKey(quote.instrument_token || key) || key;
      out[sym] = { ltp: quote.last_price };
    }
    return NextResponse.json({ source: "upstox", quotes: out });
  } catch (error) {
    const status = error.status === 401 ? 401 : 502;
    return NextResponse.json({ error: error.message, fallback: "simulator" }, { status });
  }
}
