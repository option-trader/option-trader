import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import { Check, X } from "@/components/Icons";

export const metadata = {
  title: "Pricing — AutoTrade Bot",
  description: "Start free with paper trading. Upgrade for live market data and execution.",
};

const PLANS = [
  {
    name: "Paper",
    price: "Free",
    tagline: "forever",
    blurb: "Prove your strategy with zero risk.",
    cta: "Start Free",
    href: "/login?demo=1",
    features: ["₹5,00,000 virtual capital", "15 Nifty 50 stocks", "AUTO + MANUAL modes", "All condition types & presets", "SL/TP + daily loss limit", "Live activity log & stats"],
  },
  {
    name: "Pro",
    price: "₹999",
    tagline: "/month",
    blurb: "Real market data. Same discipline.",
    cta: "Get Pro",
    href: "/login",
    featured: true,
    features: ["Everything in Paper", "Upstox account connection", "Live NSE market prices", "Automatic simulator fallback", "Persistent trade history", "Priority email support"],
  },
  {
    name: "Desk",
    price: "₹2,499",
    tagline: "/month",
    blurb: "For traders going fully live.",
    cta: "Contact Us",
    href: "mailto:hello@autotradebot.in",
    features: ["Everything in Pro", "Live order execution (opt-in)", "Multi-stock watching", "Custom condition requests", "Dedicated onboarding call", "WhatsApp support"],
  },
];

const MATRIX = [
  ["Virtual paper capital", true, true, true],
  ["User-defined conditions", true, true, true],
  ["Preset patterns (MA cross, RSI, breakout)", true, true, true],
  ["Stop-loss / take-profit / daily limit", true, true, true],
  ["Live Upstox market data", false, true, true],
  ["Persistent trade history", false, true, true],
  ["Live order execution", false, false, true],
  ["Multi-stock strategies", false, false, true],
  ["Dedicated onboarding", false, false, true],
];

const FAQS = [
  ["Can I really use it free forever?", "Yes. Paper trading with full features is free with no time limit and no card required. We want you to prove your strategy before paying anything."],
  ["Do I need an Upstox account?", "Only for Pro and Desk. Paper mode needs nothing — click Try Demo and you're trading in five seconds."],
  ["Is live trading risky?", "Yes — all real trading is. That's why it's Desk-only, disabled by default, and requires an explicit opt-in with warnings. Test in paper mode first, always."],
  ["Can I cancel anytime?", "Yes, cancellation is immediate and you keep access until the end of the billing period."],
  ["Do you take a cut of profits?", "Never. Flat subscription only. Your profits (and losses) are entirely yours."],
];

export default function Pricing() {
  return (
    <div className="relative overflow-x-clip">
      <SiteNav />

      <section className="relative px-6 pb-10 pt-36 text-center">
        <div className="hero-grid absolute inset-0" />
        <div className="relative">
          <h1 className="text-4xl font-black tracking-tight text-zinc-100 sm:text-5xl">
            Pricing that <span className="text-gradient-gold">respects your capital</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
            No profit cuts, no hidden fees, no lock-in. Start free in paper mode and upgrade only
            when the bot has earned your trust.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`card-3d card-3d-hover relative flex flex-col rounded-2xl border p-7 ${
                p.featured ? "border-gold/50 bg-ink-800" : "border-ink-500 bg-ink-800/60"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-[10px] font-black uppercase tracking-wider text-ink-900">
                  Most Popular
                </span>
              )}
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">{p.name}</h2>
              <div className="mt-3 flex items-baseline gap-1">
                <span className={`text-4xl font-black ${p.featured ? "text-gradient-gold" : "text-zinc-100"}`}>{p.price}</span>
                <span className="text-sm text-zinc-500">{p.tagline}</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">{p.blurb}</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                    <Check width="15" height="15" className="mt-0.5 shrink-0 text-gold" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`mt-7 rounded-xl py-2.5 text-center text-sm font-bold transition-all duration-200 ${
                  p.featured
                    ? "gold-glow bg-gold text-ink-900 hover:bg-gold-light"
                    : "border border-ink-400 text-zinc-200 hover:border-gold/40"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* comparison matrix */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="text-center text-2xl font-black text-zinc-100">Compare plans</h2>
        <div className="card-3d mt-8 overflow-x-auto rounded-2xl border border-ink-500">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-700 text-zinc-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Feature</th>
                <th className="px-4 py-3 text-center font-semibold">Paper</th>
                <th className="px-4 py-3 text-center font-semibold text-gold">Pro</th>
                <th className="px-4 py-3 text-center font-semibold">Desk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600 bg-ink-800/60">
              {MATRIX.map(([feat, ...cols]) => (
                <tr key={feat}>
                  <td className="px-4 py-3 text-zinc-300">{feat}</td>
                  {cols.map((v, i) => (
                    <td key={i} className="px-4 py-3 text-center">
                      {v ? (
                        <Check width="16" height="16" className="mx-auto text-bull" />
                      ) : (
                        <X width="16" height="16" className="mx-auto text-zinc-600" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <h2 className="text-center text-2xl font-black text-zinc-100">Questions, answered</h2>
        <div className="mt-8 space-y-3">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group rounded-xl border border-ink-600 bg-ink-800/60 p-4 transition-colors open:border-gold/30">
              <summary className="cursor-pointer list-none text-sm font-bold text-zinc-100 marker:hidden">
                {q}
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{a}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/login?demo=1"
            className="gold-glow inline-block rounded-xl bg-gold px-8 py-3.5 text-sm font-bold text-ink-900 transition-all duration-200 hover:bg-gold-light"
          >
            Start Free — No Card Needed
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
