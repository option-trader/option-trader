# ⚡ AutoTrade Bot — Paper Trading with User-Defined Patterns

A paper-trading simulator for Nifty 50 stocks where **you define exactly when to buy and sell** — "Buy when price hits ₹1650, sell at ₹1700" — and the bot watches the market and executes (or asks you first). Live TradingView chart, preset patterns, full risk management. **No real money, no broker, no database — pure trading logic.**

![stack](https://img.shields.io/badge/Next.js-14-black) ![charts](https://img.shields.io/badge/Lightweight--Charts-4-gold) ![mode](https://img.shields.io/badge/mode-paper%20trading-green)

## Core idea

Not pre-built patterns — **user-defined conditions**:

- *"Buy when price hits ₹1650"* → green horizontal line on the chart, bot watches
- *"Sell when price hits ₹1700"* → red line, bot exits
- **⚡ Auto-execute** — bot trades the moment the condition fires
- **🔔 Ask me first** — bot pops a 2-step confirmation ("BUY SIGNAL at ₹1650 — Execute? YES/NO")

## Features

- **Mock live market** — 15 Nifty 50 stocks, realistic random-walk prices ticking every second (trend regimes + mean reversion), 60 ticks → 1-min candle, ~12,600 minutes seeded so MAs work instantly on every timeframe
- **Live chart** — candlesticks (1m/5m/15m/1h), optional MA50/MA200 overlay, **your buy/sell levels drawn as horizontal lines** (solid = entry levels, dashed = SL/TP), dots where signals fired, entry/SL/TP lines for open positions
- **Condition builder (AUTO mode)** — for each of BUY and SELL choose:
  - *Price* — at / above / below a ₹ level
  - *Moving Avg* — price at/above/below MA50 or MA200
  - **Confidence %** controls how tight the "at" trigger band is (higher = stricter)
- **Preset patterns** (quick select): MA Crossover (50×200), Support/Resistance breakout (50-candle high/low), RSI overbought/oversold, Volume spike — or Custom price levels
- **Edge-triggered signals** — conditions fire once on the transition (crossing the level), not repeatedly while true
- **MANUAL mode** — BUY NOW / SELL NOW → enter qty + stop-loss ₹ + take-profit ₹ → CONFIRM → instant simulated execution at live price
- **Risk management** — absolute-price SL/TP monitored every tick on all open positions (wrong-side levels are rejected with a log warning), partial closes supported, ₹10,000 daily loss limit pauses all trading
- **Trade history** — open positions shown as live OPEN rows alongside closed trades, with the stats strip (total/closed/open/win rate/avg win/avg loss/total P&L) below the table
- **Activity log** — timestamped feed of everything the bot does, in the spec's format (`📊 BUY condition: Price hits ₹1,650` → `🟢 BUY SIGNAL! Executing…` → `✅ BOUGHT 5 INFY @ ₹1,665.74`)
- **Design** — dark + gold, red/green trade colors, Framer Motion animations, mobile responsive

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Click **TRY DEMO** to use the paper-trading simulator immediately — no keys needed.

Production: `npm run build && npm start` (respects `$PORT`).

## Connecting Upstox (real market data)

1. Copy `.env.local.example` → `.env.local`.
2. Create an app at <https://account.upstox.com/developer/apps> with redirect URL
   `http://localhost:3000/auth/callback` (must match exactly).
3. Fill `NEXT_PUBLIC_UPSTOX_API_KEY`, `UPSTOX_API_SECRET`, and generate an `ENCRYPTION_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Restart `npm run dev`, click **LOGIN WITH UPSTOX**, authorize.
5. The dashboard header switches to **MARKET LIVE (UPSTOX)** — real LTPs drive the candles.
   If the market is closed or the API is unreachable, it falls back to the simulator
   automatically (and retries live once a minute).

Optional — Supabase persistence: create a project, run `supabase/schema.sql` in the SQL
editor, fill the `SUPABASE_*` vars. Without it, tokens live only in encrypted httpOnly
cookies and trades stay in memory (works fine for demos).

**Auth flow**: `/` (login) → Upstox OAuth dialog → `/auth/callback` → `POST /api/auth/upstox`
(server exchanges code, secret never leaves the server) → encrypted httpOnly cookie →
`/dashboard` (guarded by `middleware.js`). Upstox tokens expire ~3:30 AM IST daily — the
app auto-redirects to re-login when that happens.

## How to use

**AUTO mode** (the dream: define once, bot watches all day)
1. Pick a stock and timeframe.
2. Pattern: keep **Custom (price levels)** or pick a preset.
3. Define BUY condition (e.g. Price *at* ₹1650) and SELL condition (e.g. Price *at* ₹1700) — they appear as lines on the chart.
4. Set Qty, optional Stop Loss ₹ / Take Profit ₹, and Confidence %.
5. Choose **⚡ Auto-execute** or **🔔 Ask me first**.
6. **🚀 START AUTO**. Watch the activity log.

**MANUAL mode**
1. Watch the chart. When ready: **💰 BUY NOW** (or **🔴 SELL NOW**).
2. Enter quantity, optional stop-loss and take-profit prices.
3. **✅ CONFIRM** — executes instantly at the live price.

> ⚠️ Refreshing the page resets everything — in-memory by design for this MVP.

## Architecture

```
app/page.js               login — Upstox OAuth or Demo mode
app/dashboard/page.js     dashboard — 1s tick loop, strategy evaluation, wiring
app/auth/callback/        OAuth callback → exchanges code via /api/auth/upstox
app/api/auth/*            token exchange (rate-limited), session, logout
app/api/market/quote      Upstox LTP proxy (session token, server-side)
middleware.js             /dashboard route guard (cookie-based)
lib/stocks.js             Nifty 50 universe (symbol, base price, ISIN → instrument key)
lib/simulator.js          random-walk ticks + 1-min candle builder + seeding
                            (tickWithPrice() lets live LTPs drive the same pipeline)
lib/marketData.js         live-vs-simulator source with auto fallback + retry
lib/upstox.js             server-side Upstox v2 wrappers (quotes, candles, orders)
lib/session.js            httpOnly cookie sessions (demo / upstox)
lib/encryption.js         AES-256-GCM token encryption
lib/supabase.js           persistence (graceful no-op until configured)
lib/conditions.js         ★ user-defined condition engine: StrategyWatcher
                            (price/MA/at-above-below, edge-triggered), presets
                            (ma-cross, breakout, RSI14, volume spike)
lib/indicators.js         SMA + crossover detection
lib/timeframe.js          1-min → 5m/15m/1h aggregation
lib/engine.js             paper engine: positions, absolute/pct SL-TP, partial
                            closes, daily loss limit, stats
components/Chart.js       Lightweight Charts wrapper + createPriceLine levels
components/SignalModal.js 2-step "Execute? YES/NO" confirmation
components/*              control panel (condition builder), stats, history, log
supabase/schema.sql       tables: user_tokens, trades, activity_logs
```

All client-side. Swapping in a real broker later = replace `MarketSimulator` with a live feed and `TradingEngine.open/close` with order calls — `StrategyWatcher` doesn't change at all.

## Deploy

**Railway**: New Project → Deploy from GitHub repo (auto-detects Next.js; `npm start` reads `$PORT`).
**Render**: New Web Service → build `npm install && npm run build`, start `npm start`, Free instance is fine.

## Roadmap (v2)

- Live order placement via Upstox (wrappers ready in `lib/upstox.js`, gated behind opt-in)
- WebSocket market feed (replace 1s LTP polling)
- DB-backed trade history via Supabase (schema ready)
- More condition types (candle patterns, time-based, trailing stops)
- Multi-strategy: watch several stocks/conditions simultaneously

---

**Disclaimer**: simulation only. Nothing here is investment advice.
