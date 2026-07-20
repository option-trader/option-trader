"use client";

import { useEffect, useRef, useState } from "react";

// Smoothly animates toward `value` whenever it changes (count-up effect).
// Uses rAF + ease-out; snaps instantly when prefers-reduced-motion.
function useCountUp(value, duration = 600) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef();

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = value;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return display;
}

const inr = (v) =>
  "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function StatsBar({ stats }) {
  const pnlCls = (v) => (v > 0 ? "text-bull glow-bull" : v < 0 ? "text-bear glow-bear" : "text-zinc-300");
  return (
    <div className="grid grid-cols-4 gap-2 lg:grid-cols-8" style={{ perspective: "1200px" }}>
      <Stat label="Capital (free)" value={stats.capital} fmt={inr} />
      <Stat label="Equity" value={stats.equity} fmt={inr} cls="text-gold-light" />
      <Stat label="Realized P&L" value={stats.realizedPnl} fmt={inr} cls={pnlCls(stats.realizedPnl)} />
      <Stat label="Unrealized P&L" value={stats.unrealizedPnl} fmt={inr} cls={pnlCls(stats.unrealizedPnl)} />
      <Stat label="Trades" value={stats.totalTrades} fmt={(v) => Math.round(v)} />
      <Stat label="Win Rate" value={stats.winRate} fmt={(v) => `${Math.round(v)}%`} cls={stats.winRate >= 50 ? "text-bull" : "text-zinc-300"} />
      <Stat label="Avg Win" value={stats.avgWin} fmt={inr} cls="text-bull" />
      <Stat label="Avg Loss" value={stats.avgLoss} fmt={inr} cls="text-bear" />
    </div>
  );
}

function Stat({ label, value, fmt, cls = "text-zinc-200" }) {
  const display = useCountUp(Number(value) || 0);
  return (
    <div className="card-3d card-3d-hover rounded-lg border border-ink-500 bg-ink-800/80 px-3 py-2 backdrop-blur-sm">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`font-mono text-sm font-semibold tabular-nums transition-colors duration-300 ${cls}`}>
        {fmt(display)}
      </div>
    </div>
  );
}
