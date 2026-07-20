import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import { Target, Shield, Bolt, TrendingUp, ArrowRight } from "@/components/Icons";

export const metadata = {
  title: "About — AutoTrade Bot",
  description: "Why we built a trading bot that follows your rules, not ours.",
};

export default function About() {
  return (
    <div className="relative overflow-x-clip">
      <SiteNav />

      <section className="relative px-6 pb-16 pt-36">
        <div className="hero-grid absolute inset-0" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-black tracking-tight text-zinc-100 sm:text-5xl">
            Built for traders who want
            <br />
            <span className="text-gradient-gold">discipline, not luck.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">
            Most retail traders don&apos;t lose because their ideas are bad — they lose because they
            hesitate, revenge-trade, or stare at charts until emotion takes over. AutoTrade Bot
            exists to remove the human failure mode: you decide the rules calmly beforehand, and the
            bot executes them without fear or greed.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-5 md:grid-cols-2">
          <ValueCard icon={Target} title="Rules over vibes">
            Every trade starts from an explicit, visible condition — a price level or an indicator
            trigger you set yourself. No black-box AI deciding with your money. If the bot did it,
            it&apos;s because you told it to.
          </ValueCard>
          <ValueCard icon={Shield} title="Risk first, profit second">
            Stop-loss, take-profit and a hard daily loss limit are first-class citizens, checked on
            every single tick. The bot is designed to protect capital before it chases returns.
          </ValueCard>
          <ValueCard icon={Bolt} title="Paper before real">
            You get ₹5,00,000 of virtual capital and a full simulated market from day one. Prove
            the strategy works before a single real rupee is at risk. Live trading is always opt-in.
          </ValueCard>
          <ValueCard icon={TrendingUp} title="Transparent by design">
            Every signal, execution, skip and stop is written to a live activity log with a
            timestamp. Full trade history with win rate, average win/loss and P&L — nothing hidden.
          </ValueCard>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="card-3d rounded-2xl border border-ink-500 bg-ink-800 p-8 md:p-10">
          <h2 className="text-xl font-black text-zinc-100">The story</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-400">
            <p>
              AutoTrade Bot started with a simple frustration: broker apps are built for placing
              orders, not for <em className="not-italic text-zinc-200">watching</em> for them. If your plan is
              &ldquo;buy INFY when it dips to ₹1,650&rdquo;, your options were to sit glued to a
              screen or set crude broker alerts and hope you see them in time.
            </p>
            <p>
              So we built the missing layer: a watcher that understands conditions the way traders
              phrase them — at, above, below, crossing — draws them on the chart, and acts the
              moment the market agrees. With a paper-trading engine underneath so the whole loop can
              be tested risk-free, and Upstox integration on top for when it&apos;s time to go live.
            </p>
            <p>
              It&apos;s a small, sharp tool. It doesn&apos;t predict the market, and it never will.
              It just executes <span className="font-semibold text-gold">your</span> plan, perfectly, every time.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 pt-6 text-center">
        <Link
          href="/login?demo=1"
          className="gold-glow inline-flex items-center gap-2 rounded-xl bg-gold px-7 py-3.5 text-sm font-bold text-ink-900 transition-all duration-200 hover:bg-gold-light"
        >
          Try it yourself — Free <ArrowRight width="16" height="16" />
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}

function ValueCard({ icon: Icon, title, children }) {
  return (
    <div className="card-3d card-3d-hover rounded-2xl border border-ink-500 bg-ink-800 p-7">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl text-gold" style={{ backgroundColor: "rgba(224,182,74,0.12)" }}>
        <Icon width="20" height="20" />
      </span>
      <h3 className="mt-4 text-base font-bold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{children}</p>
    </div>
  );
}
