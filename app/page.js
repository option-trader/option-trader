"use client";

import { Suspense } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { Bolt, CandlestickChart, Shield, ArrowRight } from "@/components/Icons";
import dynamic from "next/dynamic";

const Scene3D = dynamic(() => import("@/components/Scene3D"), { ssr: false });

export default function Landing() {
  return (
    <div className="relative overflow-x-clip" style={{ backgroundColor: "#0a0a0a" }}>
      <SiteNav />

      {/* ================= HERO ================= */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-28">
        {/* 3D Background */}
        <Suspense fallback={null}>
          <Scene3D />
        </Suspense>

        {/* Fallback glow orbs (visible behind 3D) */}
        <div className="glow-orb left-[10%] top-[15%] h-96 w-96" style={{ backgroundColor: "rgba(212,175,55,0.08)" }} />
        <div className="glow-orb right-[10%] top-[40%] h-80 w-80" style={{ backgroundColor: "rgba(212,175,55,0.04)" }} />

        <div className="relative z-10 max-w-3xl text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold"
            style={{ borderColor: "rgba(212,175,55,0.3)", backgroundColor: "rgba(212,175,55,0.1)", color: "#D4AF37" }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: "#D4AF37" }} />
            Paper trading free forever — no broker needed
          </span>

          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-zinc-100 sm:text-6xl lg:text-7xl">
            AutoTrade
            <br />
            <span className="text-gradient-gold">Bot</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Automate your Nifty 50 trading with rule-based execution.
            Set your conditions, and the bot handles the rest — or asks you first.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login?demo=1"
              className="gold-glow btn-ripple inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-black transition-all duration-200 hover:scale-[1.03]"
              style={{ backgroundColor: "#D4AF37" }}
            >
              Launch the Bot — Free <ArrowRight width="16" height="16" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-xl border px-7 py-3.5 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              Learn More
            </Link>
          </div>

          <p className="mt-4 text-xs text-zinc-600">
            ₹5,00,000 virtual capital · 15 Nifty stocks · No signup required
          </p>
        </div>

        {/* 3D tilted dashboard mockup */}
        <div
          className="card-3d chart-tilt relative z-10 mx-auto mb-[-60px] mt-14 w-full max-w-4xl rounded-2xl border p-3 shadow-2xl"
          style={{ borderColor: "#333", backgroundColor: "#1a1a1a" }}
        >
          <MockDashboard />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 rounded-b-2xl bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>
      </section>

      {/* ================= STATS BAR ================= */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["15", "Nifty 50 Stocks"],
            ["₹5L", "Virtual Capital"],
            ["60+", "Ticks / Minute"],
            ["0", "Real Money at Risk"],
          ].map(([num, label]) => (
            <div key={label} className="card-3d rounded-2xl border p-5 text-center" style={{ borderColor: "#333", backgroundColor: "#111114" }}>
              <div className="text-3xl font-black" style={{ color: "#D4AF37" }}>{num}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-10 pt-12">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-zinc-100 sm:text-4xl">
            Everything you need.
            <br />
            <span style={{ color: "#D4AF37" }}>None of the complexity.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={Bolt}
            title="Auto-Execute"
            text="The bot fires trades instantly when your conditions are met. Edge-triggered execution — fires once on the cross, never spams."
          />
          <Feature
            icon={CandlestickChart}
            title="Real-time Chart"
            text="TradingView-grade candlesticks with MA overlays, multiple timeframes, live signal markers, and your levels as price lines."
          />
          <Feature
            icon={Shield}
            title="Risk Management"
            text="Stop-loss and take-profit monitored every tick. Daily loss limit pauses all trading before a bad day becomes a terrible one."
          />
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-black tracking-tight text-zinc-100">
          Live in <span style={{ color: "#D4AF37" }}>three steps</span>
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Step n="01" title="Pick a stock" text="Choose from 15 Nifty 50 names. The live chart loads instantly with full indicator history." />
          <Step n="02" title="Set your rules" text="Buy level, sell level, stop-loss, quantity. Or load a preset pattern. Your levels appear on the chart." />
          <Step n="03" title="Press START" text="The bot watches every tick. Auto-executes or asks first — your call. Every action logged live." />
        </div>
      </section>

      {/* ================= CONDITION TYPES ================= */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-zinc-100 sm:text-4xl">
            Build <span style={{ color: "#D4AF37" }}>any strategy</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-500">
            From simple price alerts to complex multi-indicator conditions. The bot watches, you decide.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[
            { label: "Price Levels", desc: "Buy when price hits ₹1,650. Sell at ₹1,700. Simple, powerful." },
            { label: "Moving Averages", desc: "MA50/MA200 crossover detection with configurable sensitivity." },
            { label: "RSI Signals", desc: "Overbought/oversold conditions based on 14-period RSI." },
            { label: "Volume Spikes", desc: "Detect unusual volume activity that precedes big moves." },
          ].map((c) => (
            <div
              key={c.label}
              className="card-3d card-3d-hover rounded-2xl border p-5"
              style={{ borderColor: "#333", backgroundColor: "#111114" }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(212,175,55,0.12)", color: "#D4AF37" }}>
                  <Bolt width="14" height="14" />
                </span>
                <h3 className="text-sm font-bold text-zinc-100">{c.label}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="glow-orb left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: "rgba(212,175,55,0.08)" }} />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-zinc-100 sm:text-4xl">
            The market won&apos;t wait.
            <br />
            <span style={{ color: "#D4AF37" }}>Neither should you.</span>
          </h2>
          <Link
            href="/login?demo=1"
            className="gold-glow btn-ripple mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-black transition-all duration-200 hover:scale-[1.03]"
            style={{ backgroundColor: "#D4AF37" }}
          >
            Launch the Bot — Free <ArrowRight width="16" height="16" />
          </Link>
          <p className="mt-4 text-xs text-zinc-600">No credit card. No broker account. Just you and the market.</p>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 border-t py-12" style={{ borderColor: "#333" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>
                <Bolt width="15" height="15" />
              </span>
              <span className="font-black text-zinc-100">
                AutoTrade<span style={{ color: "#D4AF37" }}>Bot</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/terms" className="transition-colors hover:text-zinc-100">Terms</Link>
              <Link href="/privacy" className="transition-colors hover:text-zinc-100">Privacy</Link>
              <Link href="/docs" className="transition-colors hover:text-zinc-100">Docs</Link>
              <Link href="/about" className="transition-colors hover:text-zinc-100">About</Link>
            </div>
          </div>
          <div className="mt-8 border-t pt-6 text-center text-xs text-zinc-600" style={{ borderColor: "#333" }}>
            <span>© 2026 AutoTrade Bot. All rights reserved.</span>
            <span className="mx-2">·</span>
            <span>Trading involves risk. Paper trading is simulated.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- pieces ---------- */

function Feature({ icon: Icon, title, text }) {
  return (
    <div
      className="card-3d card-3d-hover cursor-pointer rounded-2xl border p-6"
      style={{ borderColor: "#333", backgroundColor: "#1a1a1a" }}
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: "rgba(212,175,55,0.12)", color: "#D4AF37" }}
      >
        <Icon width="20" height="20" />
      </span>
      <h3 className="mt-4 text-base font-bold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{text}</p>
    </div>
  );
}

function Step({ n, title, text }) {
  return (
    <div className="card-3d relative rounded-2xl border p-6" style={{ borderColor: "#333", backgroundColor: "rgba(26,26,26,0.5)" }}>
      <span className="font-mono text-4xl font-black" style={{ color: "rgba(212,175,55,0.25)" }}>{n}</span>
      <h3 className="mt-2 text-base font-bold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{text}</p>
    </div>
  );
}

function MockDashboard() {
  const bars = [42, 55, 48, 62, 58, 70, 66, 78, 72, 84, 76, 88, 80, 92, 86, 74, 82, 90, 96, 88, 94, 100, 92, 98];
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "#333", backgroundColor: "#0a0a0a" }}>
      <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: "#333" }}>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#ef4444" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#D4AF37" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
        </div>
        <span className="font-mono text-[10px] text-zinc-600">INFY · 1min · MA50/200</span>
        <span className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
          <span className="h-1 w-1 animate-pulse rounded-full" style={{ backgroundColor: "#22c55e" }} /> LIVE
        </span>
      </div>
      <div className="relative flex h-56 items-end gap-[3px] px-4 pb-4 pt-6 sm:h-64">
        {bars.map((h, i) => {
          const up = i % 3 !== 0;
          return (
            <div key={i} className="relative flex-1">
              <div
                className="w-full rounded-sm"
                style={{ height: `${h * 1.6}px`, backgroundColor: up ? "rgba(34,197,94,0.8)" : "rgba(239,68,68,0.8)" }}
              />
            </div>
          );
        })}
        <div className="absolute inset-x-4 top-[28%] border-t border-dashed" style={{ borderColor: "rgba(239,68,68,0.6)" }}>
          <span className="absolute right-0 -top-2.5 rounded px-1.5 text-[9px] font-bold text-white" style={{ backgroundColor: "#ef4444" }}>SELL ₹1,700</span>
        </div>
        <div className="absolute inset-x-4 top-[62%] border-t border-dashed" style={{ borderColor: "rgba(34,197,94,0.6)" }}>
          <span className="absolute right-0 -top-2.5 rounded px-1.5 text-[9px] font-bold text-white" style={{ backgroundColor: "#22c55e" }}>BUY ₹1,650</span>
        </div>
      </div>
      <div className="grid grid-cols-4 divide-x border-t text-center" style={{ borderColor: "#333", divideColor: "#333" }}>
        {[
          ["EQUITY", "₹5.24L", "#D4AF37"],
          ["P&L TODAY", "+₹24,180", "#22c55e"],
          ["WIN RATE", "68%", "#f4f4f5"],
          ["TRADES", "31", "#f4f4f5"],
        ].map(([k, v, c]) => (
          <div key={k} className="px-2 py-2.5">
            <div className="text-[9px] uppercase tracking-wider text-zinc-600">{k}</div>
            <div className="font-mono text-xs font-bold" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
