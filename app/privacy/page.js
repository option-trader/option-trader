"use client";

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

const Printer = (props) => (
  <svg
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    {...props}
  >
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect width="12" height="8" x="6" y="14" />
  </svg>
);

export default function Privacy() {
  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6 lg:px-8"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <div className="mx-auto max-w-[800px]">
        {/* Header with back button and print button */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
              Privacy Policy
            </h1>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-white/5"
            style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-8">
          <Section n="1" title="Data Collection">
            <p>
              We collect information you provide directly when using AutoTrade
              Bot, including:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-400">
              <li>Account registration details (email, name)</li>
              <li>Trading preferences and bot configurations</li>
              <li>Broker API credentials (encrypted at rest)</li>
              <li>Usage data and interaction logs</li>
              <li>Device and browser information</li>
            </ul>
          </Section>

          <Section n="2" title="Data Security">
            <p>
              We implement industry-standard security measures to protect your
              data:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-400">
              <li>AES-256 encryption for sensitive data at rest</li>
              <li>TLS 1.3 encryption for all data in transit</li>
              <li>API credentials stored in encrypted vaults</li>
              <li>Regular security audits and penetration testing</li>
              <li>Role-based access control for internal systems</li>
            </ul>
          </Section>

          <Section n="3" title="Data Sharing">
            <p>
              We do not sell your personal information. We may share data only
              in these circumstances:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-400">
              <li>
                With your broker (Upstox) to execute trades you authorize
              </li>
              <li>
                With service providers who assist in platform operations
                (under strict confidentiality)
              </li>
              <li>
                When required by law, regulation, or legal process
              </li>
              <li>
                To protect the rights, property, or safety of our users
              </li>
            </ul>
          </Section>

          <Section n="4" title="Data Deletion">
            <p>
              You have the right to delete your data at any time:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-400">
              <li>
                Delete your account from the dashboard settings
              </li>
              <li>
                Request manual data deletion via email
              </li>
              <li>
                All trading history and configurations removed within 30 days
              </li>
              <li>
                API credentials immediately revoked and purged
              </li>
              <li>
                Backup copies purged within 90 days
              </li>
            </ul>
          </Section>

          <Section n="5" title="Cookies &amp; Tracking">
            <p>
              We use cookies and similar technologies for:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-400">
              <li>Session management and authentication</li>
              <li>Remembering your preferences and settings</li>
              <li>Analytics to improve platform performance</li>
              <li>Security measures (CSRF protection)</li>
            </ul>
            <p className="mt-2">
              You can control cookies through your browser settings. Disabling
              cookies may affect platform functionality.
            </p>
          </Section>

          <Section n="6" title="Policy Changes">
            <p>
              We may update this Privacy Policy periodically. Significant
              changes will be communicated via email or in-app notification at
              least 30 days before taking effect. Continued use of the platform
              after changes constitutes acceptance of the updated policy.
            </p>
          </Section>
        </div>

        {/* Footer note */}
        <div className="mt-12 border-t pt-8" style={{ borderColor: "#333" }}>
          <p className="text-center text-xs text-zinc-600">
            Last updated: 20 July 2026
          </p>
          <p className="mt-2 text-center text-xs text-zinc-600">
            For privacy-related inquiries, contact us through the platform.
          </p>
        </div>
      </div>
    </main>
  );
}

function Section({ n, title, children }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold" style={{ color: "#D4AF37" }}>
        {n}. {title}
      </h2>
      <div className="text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}
