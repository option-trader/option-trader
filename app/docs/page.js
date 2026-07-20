import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";

export const metadata = {
  title: "Documentation — AutoTrade Bot",
  description: "How to set up conditions, run AUTO mode, manage risk, and connect Upstox.",
};

const SECTIONS = [
  { id: "getting-started", label: "Getting Started" },
  { id: "auto-mode", label: "AUTO Mode" },
  { id: "manual-mode", label: "MANUAL Mode" },
  { id: "conditions", label: "Conditions & Presets" },
  { id: "risk", label: "Risk Management" },
  { id: "charts", label: "Charts & Indicators" },
  { id: "upstox", label: "Connecting Upstox" },
  { id: "faq", label: "FAQ" },
];

export default function Docs() {
  return (
    <div className="relative overflow-x-clip">
      <SiteNav />

      <div className="mx-auto flex max-w-6xl gap-10 px-6 pb-24 pt-32">
        {/* sidebar */}
        <aside className="sticky top-28 hidden h-fit w-52 shrink-0 lg:block">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">On this page</p>
          <nav className="mt-3 space-y-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-gold"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* content */}
        <main className="min-w-0 flex-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-100 sm:text-4xl">Documentation</h1>
          <p className="mt-2 text-sm text-zinc-500">Everything you need to go from zero to your first automated trade.</p>

          <Doc id="getting-started" title="Getting Started">
            <p>
              Click <b>Try Free Demo</b> — no signup needed. You land on the dashboard with
              ₹5,00,000 of virtual capital and a live simulated market for 15 Nifty 50 stocks
              ticking every second.
            </p>
            <Steps items={[
              "Pick a stock from the dropdown (e.g. INFY).",
              "Choose a timeframe — 1min, 5min, 15min or 1hour.",
              "Pick AUTO (bot watches for you) or MANUAL (you click the trigger).",
              "Watch the Activity Log at the bottom — every action the bot takes is recorded there.",
            ]} />
            <Note>Paper trading state is in-memory: refreshing the page resets capital and history.</Note>
          </Doc>

          <Doc id="auto-mode" title="AUTO Mode">
            <p>
              AUTO mode is the core of the product: define conditions once, press <b>START AUTO</b>,
              and the bot evaluates them on every tick.
            </p>
            <Steps items={[
              "Define a BUY condition — e.g. Price at ₹1,650. It appears as a green line on the chart.",
              "Define a SELL condition — e.g. Price at ₹1,700. Red line on the chart.",
              "Set quantity, optional Stop Loss ₹ and Take Profit ₹ (drawn as dashed lines).",
              "Choose Auto-execute (fires instantly) or Ask me first (confirmation popup).",
              "Press START AUTO. The button turns into STOP AUTO — press again anytime to stand down.",
            ]} />
            <p>
              Conditions are <b>edge-triggered</b>: they fire once when the price <em>crosses</em> the
              level, not repeatedly while the price sits beyond it. The <b>Confidence&nbsp;%</b> setting
              controls how tight the trigger band is for &ldquo;at&rdquo; conditions — higher = stricter.
            </p>
          </Doc>

          <Doc id="manual-mode" title="MANUAL Mode">
            <p>
              You watch the chart; the bot handles the mechanics. Hit <b>BUY NOW</b> or <b>SELL NOW</b>,
              enter quantity and optional stop/target, then <b>CONFIRM</b> — executed instantly at the
              live price. If you already hold an opposite position, the order closes it instead.
            </p>
          </Doc>

          <Doc id="conditions" title="Conditions & Presets">
            <p>Each BUY/SELL condition is built from three parts:</p>
            <Table
              head={["Part", "Options", "Meaning"]}
              rows={[
                ["Source", "Price · Moving Avg", "What to watch — the live price, or price vs MA50/MA200"],
                ["Operator", "At · Above · Below", "How to compare against the level"],
                ["Level", "₹ value or MA period", "The trigger threshold"],
              ]}
            />
            <p className="mt-3">Or load a preset and tweak it:</p>
            <Table
              head={["Preset", "What it does"]}
              rows={[
                ["MA Crossover", "Buy when MA50 crosses above MA200 (golden cross), sell on the reverse"],
                ["Breakout", "Buy above the 50-candle high, sell below the 50-candle low"],
                ["RSI Reversal", "Buy when RSI14 drops below 30 (oversold), sell above 70 (overbought)"],
                ["Volume Spike", "Trigger when volume jumps well above its recent average"],
              ]}
            />
          </Doc>

          <Doc id="risk" title="Risk Management">
            <Steps items={[
              "Stop Loss ₹ — absolute price. Checked on every tick of every open position; closes the moment it's breached.",
              "Take Profit ₹ — same mechanism on the upside.",
              "Daily Loss Limit — ₹10,000 by default. When realized losses cross it, ALL trading pauses until you explicitly resume.",
              "Wrong-side protection — a stop above your long entry (or below a short) is rejected with a log warning.",
            ]} />
            <Note>
              Levels are monitored every second, but in fast markets the simulated fill happens at the
              first tick beyond your level — just like slippage in the real world.
            </Note>
          </Doc>

          <Doc id="charts" title="Charts & Indicators">
            <p>
              TradingView Lightweight Charts rendering candlesticks with volume. Toggle the
              <b> MA50/MA200</b> overlay from the control panel; RSI14 is shown live next to the price.
              Your condition levels, entry price, SL and TP are all drawn as horizontal price lines,
              and dots mark where signals fired.
            </p>
          </Doc>

          <Doc id="upstox" title="Connecting Upstox">
            <Steps items={[
              "Click LOGIN WITH UPSTOX on the login page and authorize on Upstox's own site — your password never touches our servers.",
              "The header switches to MARKET LIVE (UPSTOX): candles are now driven by real LTPs.",
              "If the market is closed or the feed drops, the app automatically falls back to the simulator and retries live once a minute.",
              "Upstox tokens expire daily (~3:30 AM IST) — you'll be redirected to log in again next session.",
            ]} />
            <Note>
              Live <em>order execution</em> is a separate, opt-in feature (Desk plan) with explicit
              warnings — connecting Upstox only enables real market data.
            </Note>
          </Doc>

          <Doc id="faq" title="FAQ">
            <Faq q="Is my money at risk in paper mode?" a="No. Paper trading uses only virtual capital. No broker orders are placed, ever, unless you explicitly enable live trading." />
            <Faq q="Does the bot predict the market?" a="No — and be suspicious of anything that claims to. It executes YOUR rules with perfect discipline. The strategy is yours." />
            <Faq q="What happens if I close the browser while AUTO is running?" a="The watcher runs in your browser, so it stops. Server-side watching is on the roadmap for the Desk plan." />
            <Faq q="Which stocks are supported?" a="15 large-cap Nifty 50 names including TCS, INFY, RELIANCE, HDFCBANK, SBIN and ICICIBANK. More on request." />
            <Faq q="Can I run multiple strategies at once?" a="One strategy per stock at a time today; multi-strategy watching is planned." />
          </Doc>

          <div className="mt-14 rounded-2xl border border-gold/30 bg-gold/5 p-6 text-center">
            <p className="text-sm text-zinc-300">Ready to put it to work?</p>
            <Link
              href="/login?demo=1"
              className="gold-glow mt-3 inline-block rounded-xl bg-gold px-6 py-3 text-sm font-bold text-ink-900 transition-all duration-200 hover:bg-gold-light"
            >
              Open the Dashboard
            </Link>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}

/* ---------- doc building blocks ---------- */

function Doc({ id, title, children }) {
  return (
    <section id={id} className="mt-12 scroll-mt-28">
      <h2 className="border-b border-ink-600 pb-2 text-xl font-black text-zinc-100">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}

function Steps({ items }) {
  return (
    <ol className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 font-mono text-[10px] font-bold text-gold">
            {i + 1}
          </span>
          <span>{it}</span>
        </li>
      ))}
    </ol>
  );
}

function Note({ children }) {
  return (
    <p className="rounded-lg border border-gold/25 bg-gold/5 px-4 py-3 text-[13px] text-zinc-400">
      <b className="text-gold">Note:</b> {children}
    </p>
  );
}

function Table({ head, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-ink-600">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-ink-700 text-zinc-300">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-ink-600">
          {rows.map((r, i) => (
            <tr key={i} className="text-zinc-400">
              {r.map((c, j) => <td key={j} className={`px-3 py-2 ${j === 0 ? "font-semibold text-zinc-200" : ""}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Faq({ q, a }) {
  return (
    <div className="rounded-xl border border-ink-600 bg-ink-800/60 p-4">
      <h3 className="text-sm font-bold text-zinc-100">{q}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{a}</p>
    </div>
  );
}
