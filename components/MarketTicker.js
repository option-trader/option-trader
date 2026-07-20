"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const fmt = (v) => Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Top-bar market indices ticker. Click to expand mini sparkline panel.
export default function MarketTicker({ indices }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-ink-500 bg-ink-800">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 text-left"
        title="Click to expand"
      >
        {indices.map((ix) => (
          <span key={ix.key} className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400">{ix.label}:</span>
            <span className="font-mono font-semibold text-zinc-100">{fmt(ix.price)}</span>
            <span className={`font-mono ${ix.up ? "text-bull" : "text-bear"}`}>
              {ix.up ? "↑" : "↓"} ({ix.changePct >= 0 ? "+" : ""}
              {ix.changePct}%)
            </span>
          </span>
        ))}
        <span className="ml-auto text-[10px] text-zinc-600">{expanded ? "▲" : "▼"}</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 border-t border-ink-500 p-3 lg:grid-cols-4">
              {indices.map((ix) => (
                <div key={ix.key} className="rounded-md bg-ink-700 p-2">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">{ix.label}</span>
                    <span className={`font-mono text-[11px] ${ix.up ? "text-bull" : "text-bear"}`}>
                      {ix.changePct >= 0 ? "+" : ""}
                      {ix.changePct}%
                    </span>
                  </div>
                  <Sparkline points={ix.history} up={ix.up} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Sparkline({ points, up }) {
  if (!points || points.length < 2) return <div className="h-8" />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 140;
  const h = 32;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${((i / (points.length - 1)) * w).toFixed(1)},${(h - ((p - min) / range) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={up ? "#26a69a" : "#ef5350"} strokeWidth="1.5" />
    </svg>
  );
}
