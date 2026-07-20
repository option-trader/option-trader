"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { STOCKS, getStock } from "@/lib/stocks";
import { MarketSimulator } from "@/lib/simulator";
import { MarketDataSource } from "@/lib/marketData";
import { TradingEngine } from "@/lib/engine";
import { sma } from "@/lib/indicators";
import { aggregate, TIMEFRAMES } from "@/lib/timeframe";
import { StrategyWatcher, describeCondition, rsi, strategyForPreset } from "@/lib/conditions";
import { detectPatterns } from "@/lib/patterns";
import ControlPanel from "@/components/ControlPanel";
import StatsBar from "@/components/StatsBar";
import TradeHistory from "@/components/TradeHistory";
import EventLog from "@/components/EventLog";
import SignalModal from "@/components/SignalModal";

// Lazy load heavy chart component
const Chart = dynamic(() => import("@/components/Chart"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-zinc-500">Loading chart...</div>
});

// Seed enough 1-min history that MA200 is available even on the 1-hour
// timeframe (200 hourly candles ≈ 12,000 minutes).
const SEED_CANDLES = 12600;

const inr = (v) => "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

// SENSEX mock simulator (simplified for index trading)
class SensexSimulator {
  constructor(base = 80000) {
    this.price = base;
    this.candles = [];
    this.forming = null;
    this.seedHistory(12600);
  }

  seedHistory(count) {
    let price = this.price;
    const now = Math.floor(Date.now() / 1000);
    for (let i = 0; i < count; i++) {
      const time = now - (count - i) * 60;
      const open = price;
      const change = (Math.random() - 0.5) * 40;
      price = Math.max(price + change, 70000);
      price = Math.min(price, 90000);
      const high = Math.max(open, price) + Math.random() * 20;
      const low = Math.min(open, price) - Math.random() * 20;
      this.candles.push({ time, open, high, low, close: price, volume: Math.floor(50000 + Math.random() * 150000) });
    }
    this.price = price;
  }

  tick() {
    const change = (Math.random() - 0.5) * 30;
    this.price = Math.max(this.price + change, 70000);
    this.price = Math.min(this.price, 90000);
    this.forming = {
      time: Math.floor(Date.now() / 1000),
      open: this.candles[this.candles.length - 1]?.close || this.price,
      high: this.price + Math.random() * 10,
      low: this.price - Math.random() * 10,
      close: this.price,
      volume: Math.floor(Math.random() * 10000),
    };
    return { price: this.price };
  }
}

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null); // { mode: 'demo' | 'upstox' }
  const [dataSource, setDataSource] = useState("simulator"); // 'simulator' | 'upstox'
  const [symbol, setSymbol] = useState(STOCKS[0].symbol);
  const [timeframe, setTimeframe] = useState("1m");
  const [mode, setMode] = useState("AUTO");
  const [autoRunning, setAutoRunning] = useState(false);
  const [completedTrade, setCompletedTrade] = useState(null); // last finished AUTO trade (shows "Trade Complete" banner)
  const [tradingSymbol, setTradingSymbol] = useState(null); // symbol the active AUTO trade is locked to
  const [showMA, setShowMA] = useState(true);
  const [pendingSignal, setPendingSignal] = useState(null); // "ask me first" modal
  const [chartType, setChartType] = useState("NIFTY"); // 'NIFTY' | 'SENSEX'
  const [detectedPatterns, setDetectedPatterns] = useState([]);
  const [strategy, setStrategy] = useState(() => ({
    preset: "custom",
    ...strategyForPreset("custom", STOCKS[0].base),
    qty: 5,
    confidence: 80,
    slPrice: "",
    tpPrice: "",
    confirmMode: "auto", // 'auto' | 'ask'
  }));
  const [, setTickCount] = useState(0); // re-render driver

  const simsRef = useRef({}); // symbol -> MarketSimulator
  const dataSourceRef = useRef(null); // MarketDataSource (live/sim fallback)
  const engineRef = useRef(null);
  const pricesRef = useRef({}); // symbol -> last price
  const liveQuotesRef = useRef({}); // symbol -> last live LTP from Upstox
  const watcherRef = useRef(null); // StrategyWatcher while AUTO runs
  const tradePhaseRef = useRef("idle"); // 'idle' | 'waiting_entry' | 'in_trade' — one trade per START
  const completeAutoTradeRef = useRef(null); // latest completeAutoTrade for the interval callback
  const lockedCfgRef = useRef(null); // strategy + timeframe frozen at START — the trade uses THIS, not live UI state
  const chartSignalsRef = useRef({}); // `${symbol}:${tf}` -> [{time,type,text}] fired markers
  const stateRef = useRef({}); // latest UI state for the interval callback

  if (!engineRef.current) engineRef.current = new TradingEngine({ capital: 500000, dailyLossLimit: 10000 });
  const engine = engineRef.current;

  // SENSEX simulator instance
  const sensexSimRef = useRef(null);
  if (!sensexSimRef.current) sensexSimRef.current = new SensexSimulator();
  const sensexSim = sensexSimRef.current;

  if (!dataSourceRef.current) {
    const ds = new MarketDataSource();
    ds.onSourceChange = (m) => setDataSource(m);
    ds.onAuthExpired = () => router.replace("/?error=session_expired");
    dataSourceRef.current = ds;
  }

  // fetch session on mount; enable live polling if logged in via Upstox
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        if (!s.authenticated) {
          router.replace("/");
          return;
        }
        setSession(s);
        if (s.mode === "upstox") dataSourceRef.current.enableLive();
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // restore conditions saved from a locked session (e.g. page reload mid-trade)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`autotrade_locked_${symbol}`);
      if (saved) {
        const cfg = JSON.parse(saved);
        if (cfg?.strategy) setStrategy(cfg.strategy);
        // trade itself can't survive a reload (paper engine is in-memory) —
        // clear the stale lock so the user can start fresh with the same levels
        localStorage.removeItem(`autotrade_locked_${symbol}`);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  };

  stateRef.current = { autoRunning, symbol, timeframe, strategy, pendingSignal };

  const getSim = (sym) => {
    if (!simsRef.current[sym]) {
      simsRef.current[sym] = new MarketSimulator(getStock(sym), SEED_CANDLES);
      pricesRef.current[sym] = simsRef.current[sym].price;
    }
    return simsRef.current[sym];
  };
  getSim(symbol);

  // ---- one-trade-per-START lifecycle ----
  // A START press runs exactly ONE cycle: wait for entry → BUY → wait for
  // exit (sell signal OR stop loss OR take profit) → SELL → bot stops.
  // No auto-restart: the user must press START NEW TRADE for the next one.
  // The strategy/timeframe/symbol are FROZEN into lockedCfgRef at START, so
  // switching stocks or (disabled) inputs can never affect the running trade.
  const completeAutoTrade = (trade) => {
    const lockedSym = lockedCfgRef.current?.symbol;
    if (lockedSym) try { localStorage.removeItem(`autotrade_locked_${lockedSym}`); } catch {}
    tradePhaseRef.current = "idle";
    watcherRef.current = null;
    lockedCfgRef.current = null;
    setTradingSymbol(null);
    setAutoRunning(false);
    setPendingSignal(null);
    setCompletedTrade(trade || null);
    if (trade) {
      engine._log(`✅ Trade Complete. P&L: ${trade.pnl >= 0 ? "+" : ""}${inr(trade.pnl)} — bot stopped. Press START NEW TRADE for the next one.`);
    }
  };
  completeAutoTradeRef.current = completeAutoTrade;

  // ---- execute a fired signal (shared by auto-execute and modal YES) ----
  const executeSignal = (sig) => {
    const locked = lockedCfgRef.current;
    const cfg = locked?.strategy || stateRef.current.strategy;
    const price = pricesRef.current[sig.symbol];
    const pos = engine.positionFor(sig.symbol);
    engine._log(`${sig.type === "BUY" ? "🟢" : "🔴"} ${sig.type} SIGNAL! Executing…`);
    if (sig.type === "BUY") {
      if (!pos) {
        engine.open({
          symbol: sig.symbol, side: "LONG", qty: +cfg.qty || 1, price,
          stopLossPrice: +cfg.slPrice || null, takeProfitPrice: +cfg.tpPrice || null, mode: "AUTO",
        });
        // entry filled → now watch ONLY for the exit (sell / SL / TP)
        tradePhaseRef.current = "in_trade";
        watcherRef.current?.disarm("BUY");
        watcherRef.current?.rearm("SELL");
      }
    } else if (pos && pos.side === "LONG") {
      const trade = engine.close(pos.id, price, "SIGNAL");
      completeAutoTrade(trade);
    }
    // chart marker at the current (forming) candle, on the trade's timeframe
    const tf = locked?.timeframe || stateRef.current.timeframe;
    const sim = simsRef.current[sig.symbol];
    const key = `${sig.symbol}:${tf}`;
    const minutes = TIMEFRAMES.find((t) => t.key === tf)?.minutes || 1;
    const bucket = Math.floor(sim.forming.time / (minutes * 60)) * (minutes * 60);
    const arr = chartSignalsRef.current[key] || (chartSignalsRef.current[key] = []);
    if (!arr.some((m) => m.time === bucket && m.type === sig.type)) {
      arr.push({ time: bucket, type: sig.type, text: `${sig.type} ${inr(price)}` });
    }
  };

  // ---- main 1-second tick loop ----
  useEffect(() => {
    const id = setInterval(() => {
      const { autoRunning: running, pendingSignal: pending } = stateRef.current;
      // the running trade is pinned to the config frozen at START —
      // browsing other stocks/timeframes doesn't affect it
      const locked = lockedCfgRef.current;
      const sym = locked?.symbol;
      const tf = locked?.timeframe;

      // kick off a live-quote poll (no-op unless Upstox session is active);
      // results land in liveQuotesRef for the NEXT tick — 1s staleness is fine.
      const ds = dataSourceRef.current;
      ds.poll(Object.keys(simsRef.current)).then((quotes) => {
        if (quotes) liveQuotesRef.current = quotes;
      });

      // tick SENSEX simulator
      sensexSimRef.current.tick();

      // tick every instantiated simulator so SL/TP covers all open positions.
      // When a live quote exists for a symbol, drive its candle builder with
      // the real price instead of the random walk.
      for (const [s, sim] of Object.entries(simsRef.current)) {
        const live = ds.mode === "upstox" ? liveQuotesRef.current[s] : undefined;
        const { price } = live !== undefined ? sim.tickWithPrice(live) : sim.tick();
        pricesRef.current[s] = price;
        const closed = engine.onTick(s, price);
        // SL/TP closed the AUTO position → the trade cycle is complete: stop the bot
        if (running && s === sym && tradePhaseRef.current === "in_trade" && closed.length) {
          completeAutoTradeRef.current(closed[closed.length - 1]);
        }
      }

      // ---- evaluate the user-defined strategy (one trade per START) ----
      if (running && locked && !engine.paused && !pending && watcherRef.current) {
        const sim = simsRef.current[sym];
        const minutes = TIMEFRAMES.find((t) => t.key === tf)?.minutes || 1;
        const candles = aggregate(sim.candles, minutes); // finalized only
        const price = pricesRef.current[sym];
        const fired = watcherRef.current.check({ price, candles });
        // phase gate: before entry only BUY matters, after entry only SELL
        const phase = tradePhaseRef.current;
        const relevant =
          fired && ((phase === "waiting_entry" && fired === "BUY") || (phase === "in_trade" && fired === "SELL"));
        if (relevant) {
          const cfg = locked.strategy;
          const sig = {
            type: fired,
            symbol: sym,
            price,
            qty: +cfg.qty || 1,
            reason: describeCondition(fired === "BUY" ? cfg.buy : cfg.sell, fired),
          };
          if (cfg.confirmMode === "ask") {
            engine._log(`🔔 ${fired} SIGNAL at ${inr(price)} — waiting for your confirmation`);
            setPendingSignal(sig);
          } else {
            executeSignal(sig);
          }
        }
      }

      setTickCount((c) => c + 1);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  // ---- derived chart data ----
  const sim = getSim(symbol);
  const minutes = TIMEFRAMES.find((t) => t.key === timeframe)?.minutes || 1;

  // SENSEX chart data
  const sensexMinutes = TIMEFRAMES.find((t) => t.key === timeframe)?.minutes || 1;
  const sensexBaseCandles = useMemo(() => {
    return aggregate(sensexSim.candles, sensexMinutes);
  }, [sensexSim.candles.length, sensexMinutes]);

  const sensexCandles = useMemo(() => {
    const f = sensexSim.forming;
    if (!f) return sensexBaseCandles;
    const span = sensexMinutes * 60;
    const bucketTime = Math.floor(f.time / span) * span;
    const last = sensexBaseCandles[sensexBaseCandles.length - 1];
    if (last && last.time === bucketTime) {
      return [...sensexBaseCandles.slice(0, -1), {
        time: bucketTime,
        open: last.open,
        high: Math.max(last.high, f.high),
        low: Math.min(last.low, f.low),
        close: f.close,
        volume: (last.volume || 0) + (f.volume || 0),
      }];
    }
    return [...sensexBaseCandles, { ...f, time: bucketTime }];
  }, [sensexBaseCandles, sensexMinutes, sensexSim.forming?.close, sensexSim.forming?.time]);

  const sensexMa50 = useMemo(() => sma(sensexCandles, 50), [sensexCandles]);
  const sensexMa200 = useMemo(() => sma(sensexCandles, 200), [sensexCandles]);

  // Heavy math (aggregate 12k candles + MA50/200 + RSI) recomputes only when a
  // 1-min candle FINALIZES (once a minute), not on every 1-second tick.
  const { baseCandles, ma50, ma200, rsiValue } = useMemo(() => {
    const base = aggregate(sim.candles, minutes);
    return { baseCandles: base, ma50: sma(base, 50), ma200: sma(base, 200), rsiValue: rsi(base, 14) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, minutes, sim.candles.length]);

  // Per-tick: merge the live forming 1-min candle into the last bucket (O(1)).
  const candles = useMemo(() => {
    const f = sim.forming;
    if (!f) return baseCandles;
    const span = minutes * 60;
    const bucketTime = Math.floor(f.time / span) * span;
    const last = baseCandles[baseCandles.length - 1];
    if (last && last.time === bucketTime) {
      const merged = {
        time: bucketTime,
        open: last.open,
        high: Math.max(last.high, f.high),
        low: Math.min(last.low, f.low),
        close: f.close,
        volume: (last.volume || 0) + (f.volume || 0),
      };
      return [...baseCandles.slice(0, -1), merged];
    }
    return [...baseCandles, { ...f, time: bucketTime }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCandles, minutes, sim.forming?.close, sim.forming?.time]);

  const price = pricesRef.current[symbol];
  const stats = engine.stats(pricesRef.current);

  // Detect candlestick patterns (memoized, only recalculates when candles change)
  useEffect(() => {
    const patterns = detectPatterns(candles);
    setDetectedPatterns(patterns);

    // Log detected patterns to EventLog
    if (patterns.length > 0) {
      const latest = patterns[patterns.length - 1];
      engine._log(`📊 Pattern detected: ${latest.text} at ${inr(latest.time)}`);
    }
  }, [candles.length]); // Only recalculate when new candle is added

  const rawPosition = engine.positionFor(symbol);
  const position = rawPosition
    ? { ...rawPosition, livePnl: round2((rawPosition.side === "LONG" ? 1 : -1) * (price - rawPosition.entry) * rawPosition.qty) }
    : null;

  // ---- horizontal level lines on the chart ----
  const levels = useMemo(() => {
    const out = [];
    if (mode === "AUTO") {
      if (strategy.buy?.type === "price" && +strategy.buy.level)
        out.push({ price: +strategy.buy.level, color: "#26a69a", title: "BUY LEVEL" });
      if (strategy.sell?.type === "price" && +strategy.sell.level)
        out.push({ price: +strategy.sell.level, color: "#ef5350", title: "SELL LEVEL" });
      if (+strategy.slPrice) out.push({ price: +strategy.slPrice, color: "#ef5350", title: "STOP LOSS", dashed: true });
      if (+strategy.tpPrice) out.push({ price: +strategy.tpPrice, color: "#26a69a", title: "TAKE PROFIT", dashed: true });
    }
    if (position) {
      out.push({ price: position.entry, color: "#e0b64a", title: `ENTRY ${position.side}` });
      if (position.stopLoss) out.push({ price: position.stopLoss, color: "#ef5350", title: "SL", dashed: true });
      if (position.takeProfit) out.push({ price: position.takeProfit, color: "#26a69a", title: "TP", dashed: true });
    }
    return out;
  }, [mode, strategy, position]);

  const chartSignals = chartSignalsRef.current[`${symbol}:${timeframe}`] || [];

  // ---- handlers ----
  const handleStartStop = () => {
    if (!autoRunning) {
      const s = strategy;
      setCompletedTrade(null);
      watcherRef.current = new StrategyWatcher({ buy: s.buy, sell: s.sell, confidence: +s.confidence || 80 });
      // 🔒 freeze the trade config — edits/symbol switches can't touch the running trade
      lockedCfgRef.current = { symbol, timeframe, strategy: { ...s, buy: { ...s.buy }, sell: { ...s.sell } } };
      setTradingSymbol(symbol);
      try {
        localStorage.setItem(`autotrade_locked_${symbol}`, JSON.stringify(lockedCfgRef.current));
      } catch {}
      // one trade per START: if already holding this stock, watch for the exit;
      // otherwise wait for the entry first
      const holding = engine.positionFor(symbol);
      tradePhaseRef.current = holding ? "in_trade" : "waiting_entry";
      if (holding) watcherRef.current.disarm("BUY");
      engine._log(`🔒 Conditions LOCKED — AUTO started on ${symbol} (${timeframe}) qty ${s.qty}${s.confirmMode === "ask" ? " — ask before executing" : ""} · one trade per start`);
      engine._log(`📊 BUY condition: ${describeCondition(s.buy, "BUY")}`);
      engine._log(
        `📊 SELL condition: ${describeCondition(s.sell, "SELL")}${+s.slPrice ? ` OR stop ₹${s.slPrice}` : ""}${+s.tpPrice ? ` OR target ₹${s.tpPrice}` : ""}`
      );
    } else {
      const lockedSym = lockedCfgRef.current?.symbol || symbol;
      try { localStorage.removeItem(`autotrade_locked_${lockedSym}`); } catch {}
      watcherRef.current = null;
      lockedCfgRef.current = null;
      tradePhaseRef.current = "idle";
      setTradingSymbol(null);
      engine._log(`⏹ AUTO stopped on ${lockedSym} — conditions unlocked`);
      setPendingSignal(null);
    }
    setAutoRunning((r) => !r);
  };

  const handleManualOrder = ({ side, qty, slPrice, tpPrice }) => {
    const pos = engine.positionFor(symbol);
    if (side === "BUY") {
      if (pos && pos.side === "SHORT") engine.close(pos.id, price, "MANUAL", qty);
      else if (!pos) engine.open({ symbol, side: "LONG", qty, price, stopLossPrice: slPrice, takeProfitPrice: tpPrice, mode: "MANUAL" });
      else engine._log(`Already holding ${pos.side} ${symbol} — close it first`);
    } else {
      if (pos && pos.side === "LONG") engine.close(pos.id, price, "MANUAL", qty);
      else if (!pos) engine.open({ symbol, side: "SHORT", qty, price, stopLossPrice: slPrice, takeProfitPrice: tpPrice, mode: "MANUAL" });
      else engine._log(`Already holding ${pos.side} ${symbol} — close it first`);
    }
    setTickCount((c) => c + 1);
  };

  const handleClosePosition = (id) => {
    const isAutoTradePos = autoRunning && tradePhaseRef.current === "in_trade" &&
      engine.positions.find((p) => p.id === id)?.symbol === lockedCfgRef.current?.symbol;
    const trade = engine.close(id, price, "MANUAL");
    // closing the auto trade's position mid-cycle ends the cycle too
    if (isAutoTradePos) completeAutoTrade(trade);
    setTickCount((c) => c + 1);
  };

  const handleSignalYes = () => {
    if (pendingSignal) executeSignal(pendingSignal); // arming/phase handled inside
    setPendingSignal(null);
  };
  const handleSignalNo = () => {
    engine._log(`🚫 ${pendingSignal?.type} signal skipped by user`);
    // keep watching for the same signal again
    if (pendingSignal) watcherRef.current?.rearm(pendingSignal.type);
    setPendingSignal(null);
  };

  const handleSymbol = (s) => {
    setSymbol(s);
    if (autoRunning && lockedCfgRef.current) {
      // trade keeps running on its locked symbol — browsing is free.
      // Returning to the trading stock restores the locked conditions into the form.
      if (s === lockedCfgRef.current.symbol) {
        setStrategy(lockedCfgRef.current.strategy);
      }
      return;
    }
    setPendingSignal(null);
    setCompletedTrade(null);
    // refresh default custom levels around the new stock's price
    setStrategy((st) =>
      st.preset === "custom" ? { ...st, ...strategyForPreset("custom", pricesRef.current[s] || getStock(s).base) } : st
    );
  };

  return (
    <main className="flex min-h-screen flex-col gap-3 p-3">
      {/* header */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-500 bg-ink-800/90 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black tracking-tight text-gold">⚡ AutoTrade Bot</span>
          <span className="rounded bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold">
            Paper Trading
          </span>
        </div>
        <div className="flex items-center gap-3">
          {engine.paused && (
            <button
              onClick={() => {
                engine.resume();
                setTickCount((c) => c + 1);
              }}
              className="rounded-md bg-bear px-3 py-1 text-xs font-bold text-white hover:brightness-110"
            >
              ⛔ DAILY LOSS LIMIT HIT — CLICK TO RESUME
            </button>
          )}
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className={`h-2 w-2 animate-pulse rounded-full ${dataSource === "upstox" ? "bg-gold" : "bg-bull"}`} />
            {dataSource === "upstox" ? "MARKET LIVE (UPSTOX)" : "MARKET LIVE (SIMULATED)"}
          </span>
          {session && (
            <span className="rounded bg-ink-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {session.mode === "upstox" ? "🔐 Upstox" : "📄 Demo"}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="rounded-md border border-ink-400 px-2.5 py-1 text-[11px] font-bold text-zinc-400 hover:border-bear/60 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </header>

      {/* stats */}
      <StatsBar stats={stats} />

      {/* chart + controls */}
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1fr_300px]">
        <div className="card-3d overflow-hidden rounded-xl border border-ink-500 bg-ink-800">
          {/* Chart type tabs */}
          <div className="flex items-center gap-2 border-b border-ink-500 px-3 py-2">
            <button
              onClick={() => setChartType("NIFTY")}
              className={`rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${
                chartType === "NIFTY"
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-ink-500 bg-ink-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              NIFTY
            </button>
            <button
              onClick={() => setChartType("SENSEX")}
              className={`rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${
                chartType === "SENSEX"
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-ink-500 bg-ink-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              SENSEX
            </button>
            {detectedPatterns.length > 0 && (
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                {detectedPatterns.length} patterns
              </span>
            )}
          </div>
          <div className="chart-tilt h-[420px] lg:h-[520px]">
            {chartType === "NIFTY" ? (
              <Chart
                candles={candles}
                ma50={ma50}
                ma200={ma200}
                showMA={showMA}
                signals={chartSignals}
                levels={levels}
                resetKey={`${symbol}:${timeframe}`}
              />
            ) : (
              <Chart
                candles={sensexCandles}
                ma50={sensexMa50}
                ma200={sensexMa200}
                showMA={showMA}
                signals={[]}
                levels={[]}
                resetKey={`SENSEX:${timeframe}`}
              />
            )}
          </div>
        </div>
        <div className="lg:max-h-[520px] lg:overflow-y-auto lg:pr-1">
          <ControlPanel
          symbol={symbol}
          onSymbol={handleSymbol}
          timeframe={timeframe}
          onTimeframe={setTimeframe}
          mode={mode}
          onMode={setMode}
          price={price}
          showMA={showMA}
          onShowMA={setShowMA}
          rsiValue={rsiValue}
          strategy={strategy}
          onStrategy={setStrategy}
          autoRunning={autoRunning}
          onStartStop={handleStartStop}
          completedTrade={completedTrade}
          tradingSymbol={tradingSymbol}
          onManualOrder={handleManualOrder}
          position={position}
          onClosePosition={handleClosePosition}
          paused={engine.paused}
          detectedPatterns={detectedPatterns}
        />
        </div>
      </div>

      {/* history + log */}
      <div className="grid shrink-0 grid-cols-1 gap-3 lg:h-[240px] lg:grid-cols-[1fr_340px]">
        <TradeHistory trades={engine.trades} positions={engine.positions} prices={pricesRef.current} stats={stats} />
        <EventLog events={engine.events} />
      </div>

      <SignalModal signal={pendingSignal} onYes={handleSignalYes} onNo={handleSignalNo} />
    </main>
  );
}

function round2(v) {
  return Math.round(v * 100) / 100;
}
