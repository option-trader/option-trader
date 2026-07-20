"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STOCKS } from "@/lib/stocks";
import { TIMEFRAMES } from "@/lib/timeframe";
import { PRESETS, describeCondition, strategyForPreset } from "@/lib/conditions";

const inr = (v) =>
  "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const fade = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18 },
};

export default function ControlPanel({
  symbol,
  onSymbol,
  timeframe,
  onTimeframe,
  mode,
  onMode,
  price,
  showMA,
  onShowMA,
  rsiValue,
  strategy,
  onStrategy,
  autoRunning,
  onStartStop,
  completedTrade,
  tradingSymbol,
  onManualOrder,
  position,
  onClosePosition,
  paused,
}) {
  const set = (patch) => onStrategy({ ...strategy, ...patch });
  const setCond = (side, patch) => set({ [side]: { ...strategy[side], ...patch } });

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      {/* Stock + price */}
      <section className="glass card-3d rounded-lg border-ink-500 p-3">
        <label className="mb-1 block text-[11px] uppercase tracking-wider text-zinc-500">Stock</label>
        <select
          value={symbol}
          onChange={(e) => onSymbol(e.target.value)}
          className="w-full rounded-md border border-gold/25 bg-ink-700/70 p-2 text-sm outline-none focus:border-gold"
        >
          {STOCKS.map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.symbol} — {s.name}
            </option>
          ))}
        </select>
        <div className="mt-3 flex items-baseline justify-between">
          <motion.span
            key={price}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className="font-mono text-3xl font-bold text-gold-light"
          >
            {price ? inr(price) : "—"}
          </motion.span>
          <span className="text-[11px] text-zinc-500">LIVE · 1s</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <label className="flex cursor-pointer items-center gap-1.5 text-zinc-400">
            <input type="checkbox" checked={showMA} onChange={(e) => onShowMA(e.target.checked)} className="accent-gold" />
            MA50/200 overlay
          </label>
          <span className="text-zinc-500">
            RSI14 <span className={`font-mono ${rsiValue < 30 ? "text-bull" : rsiValue > 70 ? "text-bear" : "text-zinc-300"}`}>{rsiValue ?? "—"}</span>
          </span>
        </div>
      </section>

      {/* Timeframe */}
      <section className="glass card-3d rounded-lg border-ink-500 p-3">
        <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">Timeframe</label>
        <div className="grid grid-cols-4 gap-1.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.key}
              onClick={() => onTimeframe(tf.key)}
              className={`rounded-md border p-1.5 text-xs transition-colors ${
                timeframe === tf.key
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-ink-500 bg-ink-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </section>

      {/* Mode tabs */}
      <section className="glass card-3d rounded-lg border-ink-500 p-3">
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          {["AUTO", "MANUAL"].map((m) => (
            <button
              key={m}
              onClick={() => onMode(m)}
              className={`rounded-md border p-2 text-xs font-bold tracking-wider transition-colors ${
                mode === m
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-ink-500 bg-ink-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {m === "AUTO" ? "🤖 AUTO" : "👤 MANUAL"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === "AUTO" ? (
            <motion.div key="auto" {...fade}>
              <AutoPanel
                strategy={strategy}
                set={set}
                setCond={setCond}
                price={price}
                autoRunning={autoRunning}
                onStartStop={onStartStop}
                completedTrade={completedTrade}
                tradingSymbol={tradingSymbol}
                symbol={symbol}
                paused={paused}
              />
            </motion.div>
          ) : (
            <motion.div key="manual" {...fade}>
              <ManualPanel price={price} position={position} onManualOrder={onManualOrder} paused={paused} defaultQty={strategy.qty} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Open position */}
      <AnimatePresence>
        {position && (
          <motion.section {...fade} className="rounded-lg border border-gold/40 bg-ink-800 p-3">
            <label className="mb-2 block text-[11px] uppercase tracking-wider text-gold">Open Position</label>
            <div className="space-y-1 text-xs">
              <Row k="Side" v={position.side} cls={position.side === "LONG" ? "text-bull" : "text-bear"} />
              <Row k="Qty" v={position.qty} />
              <Row k="Entry" v={inr(position.entry)} />
              <Row k="Stop Loss" v={position.stopLoss ? inr(position.stopLoss) : "—"} cls="text-bear" />
              <Row k="Take Profit" v={position.takeProfit ? inr(position.takeProfit) : "—"} cls="text-bull" />
              <Row k="Live P&L" v={(position.livePnl >= 0 ? "+" : "") + inr(position.livePnl)} cls={position.livePnl >= 0 ? "text-bull" : "text-bear"} />
            </div>
            <button
              onClick={() => onClosePosition(position.id)}
              className="mt-2 w-full rounded-md border border-ink-500 bg-ink-700 p-2 text-xs font-bold text-zinc-300 transition-colors hover:border-bear hover:text-bear"
            >
              CLOSE POSITION
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- AUTO MODE ---------------- */

function AutoPanel({ strategy, set, setCond, price, autoRunning, onStartStop, completedTrade, tradingSymbol, symbol, paused }) {
  const isCustom = strategy.preset === "custom";
  // viewing a DIFFERENT stock while a trade runs elsewhere: inputs stay usable
  // for browsing, but START is blocked (one trade at a time)
  const viewingOther = autoRunning && tradingSymbol && tradingSymbol !== symbol;
  const locked = autoRunning && !viewingOther; // trading THIS stock → 🔒 everything
  return (
    <div className="space-y-3">
      {/* 🔒 lock banner while a trade is active */}
      <AnimatePresence>
        {autoRunning && (
          <motion.div
            {...fade}
            className="rounded-md border border-gold/50 bg-gold/10 p-2.5 text-center text-xs font-bold text-gold"
          >
            🔒 CONDITIONS LOCKED — Trading Active{viewingOther ? ` on ${tradingSymbol}` : ""}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade complete banner — one trade per START */}
      <AnimatePresence>
        {!autoRunning && completedTrade && (
          <motion.div
            {...fade}
            className={`rounded-md border p-2.5 text-center text-xs font-bold ${
              completedTrade.pnl >= 0 ? "border-bull/50 bg-bull/10 text-bull" : "border-bear/50 bg-bear/10 text-bear"
            }`}
          >
            ✅ Trade Complete. P&amp;L: {(completedTrade.pnl >= 0 ? "+" : "") + inr(completedTrade.pnl)}
            <div className="mt-0.5 text-[10px] font-normal text-zinc-400">Conditions unlocked — edit or start a new trade.</div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Preset */}
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">Pattern</label>
        <select
          value={strategy.preset}
          onChange={(e) => set({ preset: e.target.value, ...strategyForPreset(e.target.value, price) })}
          disabled={autoRunning}
          className="w-full rounded-md border border-gold/25 bg-ink-700/70 p-2 text-xs outline-none focus:border-gold disabled:opacity-50"
        >
          {PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {isCustom && (
        <>
          <ConditionEditor side="buy" label="Buy Condition" color="text-bull" cond={strategy.buy} setCond={setCond} disabled={autoRunning} />
          <ConditionEditor side="sell" label="Sell Condition" color="text-bear" cond={strategy.sell} setCond={setCond} disabled={autoRunning} />
        </>
      )}
      {!isCustom && (
        <div className="rounded-md bg-ink-700 p-2 text-[11px] text-zinc-400">
          <div>🟢 {describeCondition(strategy.buy, "BUY")}</div>
          <div>🔴 {describeCondition(strategy.sell, "SELL")}</div>
        </div>
      )}

      {/* Risk */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Qty" type="number" min="1" step="1" value={strategy.qty} onChange={(e) => set({ qty: e.target.value })} disabled={autoRunning} />
        <Field
          label="Confidence %"
          type="number"
          min="0"
          max="100"
          value={strategy.confidence}
          onChange={(e) => set({ confidence: e.target.value })}
          disabled={autoRunning}
          title="How strict the trigger band is for 'at' price conditions"
        />
        <Field label="Stop Loss ₹" type="number" min="0" value={strategy.slPrice} onChange={(e) => set({ slPrice: e.target.value })} disabled={autoRunning} placeholder="optional" />
        <Field label="Take Profit ₹" type="number" min="0" value={strategy.tpPrice} onChange={(e) => set({ tpPrice: e.target.value })} disabled={autoRunning} placeholder="optional" />
      </div>

      {/* Execution style */}
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">On Signal</label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { key: "auto", label: "⚡ Auto-execute" },
            { key: "ask", label: "🔔 Ask me first" },
          ].map((o) => (
            <button
              key={o.key}
              onClick={() => set({ confirmMode: o.key })}
              disabled={autoRunning}
              className={`rounded-md border p-1.5 text-[11px] transition-colors disabled:opacity-50 ${
                strategy.confirmMode === o.key
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-ink-500 bg-ink-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onStartStop}
        disabled={paused}
        className={`w-full rounded-md p-2.5 text-sm font-bold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          autoRunning ? "bg-bear/80 text-white hover:bg-bear" : "gold-glow bg-gold text-ink-900 hover:bg-gold-light"
        }`}
      >
        {autoRunning ? `■ STOP AUTO${viewingOther ? ` (${tradingSymbol})` : ""}` : completedTrade ? "🚀 START NEW TRADE" : "🚀 START AUTO"}
      </motion.button>

      {locked && (
        <motion.p {...fade} className="text-center text-[11px] text-gold/90">
          <span className="animate-pulse">👁 One trade cycle: {describeCondition(strategy.buy, "BUY")} → exit…</span>
        </motion.p>
      )}
    </div>
  );
}

function ConditionEditor({ side, label, color, cond, setCond, disabled }) {
  const upd = (patch) => setCond(side, patch);
  return (
    <div className="rounded-md border border-ink-600 bg-ink-700/60 p-2">
      <label className={`mb-1.5 block text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</label>
      <div className="grid grid-cols-2 gap-1.5">
        <select
          value={cond.type}
          onChange={(e) => upd(e.target.value === "price" ? { type: "price", op: cond.op || "at", level: cond.level || "" } : { type: "ma", op: cond.op || "above", period: 50 })}
          disabled={disabled}
          className="rounded border border-gold/25 bg-ink-700/70 p-1.5 text-[11px] outline-none focus:border-gold disabled:opacity-50"
        >
          <option value="price">Price</option>
          <option value="ma">Moving Avg</option>
        </select>
        <select
          value={cond.op}
          onChange={(e) => upd({ op: e.target.value })}
          disabled={disabled}
          className="rounded border border-gold/25 bg-ink-700/70 p-1.5 text-[11px] outline-none focus:border-gold disabled:opacity-50"
        >
          <option value="at">At (hits)</option>
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>
        {cond.type === "price" ? (
          <input
            type="number"
            value={cond.level}
            onChange={(e) => upd({ level: e.target.value })}
            disabled={disabled}
            placeholder="₹ level"
            className="col-span-2 rounded border border-gold/25 bg-ink-700/70 p-1.5 font-mono text-[12px] outline-none focus:border-gold disabled:opacity-50"
          />
        ) : (
          <select
            value={cond.period}
            onChange={(e) => upd({ period: +e.target.value })}
            disabled={disabled}
            className="col-span-2 rounded border border-gold/25 bg-ink-700/70 p-1.5 text-[11px] outline-none focus:border-gold disabled:opacity-50"
          >
            <option value="50">MA50</option>
            <option value="200">MA200</option>
          </select>
        )}
      </div>
    </div>
  );
}

/* ---------------- MANUAL MODE ---------------- */

function ManualPanel({ price, position, onManualOrder, paused, defaultQty }) {
  const [form, setForm] = useState(null); // null | {side, qty, sl, tp}

  const openForm = (side) =>
    setForm({
      side,
      qty: position && willClose(side) ? position.qty : defaultQty || 5,
      sl: "",
      tp: "",
    });

  const willClose = (side) =>
    position && ((side === "BUY" && position.side === "SHORT") || (side === "SELL" && position.side === "LONG"));

  const confirm = () => {
    onManualOrder({ side: form.side, qty: +form.qty, slPrice: +form.sl || null, tpPrice: +form.tp || null });
    setForm(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-zinc-500">Watch the chart. Trade when ready — executes instantly at live price.</p>
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => openForm("BUY")}
          disabled={paused}
          className="rounded-md bg-bull p-2.5 text-sm font-bold tracking-widest text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          💰 BUY NOW
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => openForm("SELL")}
          disabled={paused}
          className="rounded-md bg-bear p-2.5 text-sm font-bold tracking-widest text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          🔴 SELL NOW
        </motion.button>
      </div>

      <AnimatePresence>
        {form && (
          <motion.div {...fade} className="rounded-md border border-gold/40 bg-ink-700/60 p-2.5">
            <div className="mb-2 text-[11px] font-bold text-zinc-300">
              {form.side} {willClose(form.side) ? `(closes ${position.side})` : ""} @ {inr(price)}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <Field label="Qty" type="number" min="1" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
              {!willClose(form.side) && (
                <>
                  <Field label="Stop ₹" type="number" value={form.sl} onChange={(e) => setForm({ ...form, sl: e.target.value })} placeholder="opt." />
                  <Field label="Target ₹" type="number" value={form.tp} onChange={(e) => setForm({ ...form, tp: e.target.value })} placeholder="opt." />
                </>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={confirm}
                className={`rounded-md p-2 text-xs font-bold text-white ${form.side === "BUY" ? "bg-bull" : "bg-bear"}`}
              >
                ✅ CONFIRM {form.side}
              </motion.button>
              <button onClick={() => setForm(null)} className="rounded-md border border-ink-500 bg-ink-700 p-2 text-xs text-zinc-400 hover:border-zinc-500">
                CANCEL
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- shared bits ---------------- */

function Field({ label, ...rest }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">{label}</label>
      <input
        className="w-full rounded-md border border-gold/25 bg-ink-700/70 p-1.5 font-mono text-sm outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-50"
        {...rest}
      />
    </div>
  );
}

function Row({ k, v, cls = "" }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{k}</span>
      <span className={`font-mono ${cls}`}>{v}</span>
    </div>
  );
}
