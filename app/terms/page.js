"use client";

import { useState } from "react";
import Link from "next/link";

const ArrowLeft = (props) => (
  <svg
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

export default function Terms() {
  const [accepted, setAccepted] = useState(false);

  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6 lg:px-8"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <div className="mx-auto max-w-[800px]">
        {/* Header with back button */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors hover:bg-white/5"
            style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1
            className="text-3xl font-bold sm:text-4xl"
            style={{ color: "#D4AF37" }}
          >
            Terms &amp; Conditions
          </h1>
        </div>

        {/* Content sections */}
        <div className="space-y-8">
          <Section
            n="1"
            title="Use at Your Own Risk"
          >
            AutoTrade Bot executes trades automatically based on parameters you
            configure. Trading in securities involves substantial risk of
            financial loss. You are solely responsible for every trade placed
            through your account, whether triggered manually or automatically.
            Past performance does not guarantee future results.
          </Section>

          <Section
            n="2"
            title="Automated Execution"
          >
            The bot executes exactly what you program. Incorrect parameters
            (wrong price levels, wrong quantity, inverted stop-loss) will produce
            incorrect trades. We are not liable for losses arising from your
            configuration. Always verify your settings before enabling automated
            trading.
          </Section>

          <Section
            n="3"
            title="No Guarantee of Returns"
          >
            The platform operates on technical rules and does not constitute
            investment advice or a recommendation. No representation is made
            that any account will or is likely to achieve profits or losses
            similar to those discussed. You acknowledge that there is no
            guarantee of returns when using automated trading systems.
          </Section>

          <Section
            n="4"
            title="User Responsibility"
          >
            You are responsible for: taxes on trading profits; compliance with
            SEBI and exchange regulations; risking only capital you can afford
            to lose; and keeping your API credentials secure. You must monitor
            your automated trading activity and intervene when necessary.
          </Section>

          <Section
            n="5"
            title="Limitation of Liability"
          >
            To the maximum extent permitted by law, we are not liable for
            trading losses, technical errors, broker/API downtime, data delays,
            market events, or regulatory actions. Our total liability shall not
            exceed the amount you paid for the service in the twelve months
            preceding the claim.
          </Section>
        </div>

        {/* Accept checkbox */}
        <div className="mt-10 rounded-xl border p-6" style={{ borderColor: "#333" }}>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-2 bg-transparent"
              style={{ accentColor: "#D4AF37" }}
            />
            <span className="text-sm leading-relaxed text-zinc-300">
              I have read, understood, and agree to the Terms &amp; Conditions
              outlined above. I acknowledge the risks associated with automated
              trading and accept full responsibility for any trades executed
              through this platform.
            </span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/"
            className="flex-1 rounded-xl border px-6 py-3 text-center text-sm font-semibold transition-colors hover:bg-white/5"
            style={{ borderColor: "#444", color: "#D4AF37" }}
          >
            Decline
          </Link>
          <button
            disabled={!accepted}
            className="flex-1 rounded-xl px-6 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              backgroundColor: accepted ? "#D4AF37" : "#333",
              color: accepted ? "#0a0a0a" : "#666",
            }}
          >
            Accept &amp; Continue
          </button>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-zinc-600">
          Last updated: 20 July 2026
        </p>
      </div>
    </main>
  );
}

function Section({ n, title, children }) {
  return (
    <section>
      <h2
        className="mb-2 text-xl font-bold"
        style={{ color: "#D4AF37" }}
      >
        {n}. {title}
      </h2>
      <p className="text-sm leading-relaxed text-zinc-400">{children}</p>
    </section>
  );
}
