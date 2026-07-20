import Link from "next/link";
import { Bolt } from "./Icons";

export default function SiteFooter() {
  return (
    <footer className="border-t py-12" style={{ borderColor: "#333", backgroundColor: "#0a0a0a" }}>
      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(212,175,55,0.15)", color: "#D4AF37" }}
            >
              <Bolt width="15" height="15" />
            </span>
            <span className="font-black text-zinc-100">
              AutoTrade<span style={{ color: "#D4AF37" }}>Bot</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-zinc-500">
            Rule-based trading automation for Nifty 50. Define your conditions — the bot watches the
            market and executes, or asks you first.
          </p>
        </div>

        <FooterCol
          title="Product"
          links={[
            ["/pricing", "Pricing"],
            ["/docs", "Documentation"],
            ["/login?demo=1", "Free Demo"],
            ["/dashboard", "Dashboard"],
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            ["/about", "About"],
            ["/terms", "Terms of Service"],
            ["/privacy", "Privacy Policy"],
          ]}
        />
        <FooterCol
          title="Resources"
          links={[
            ["/docs#getting-started", "Getting Started"],
            ["/docs#auto-mode", "AUTO Mode Guide"],
            ["/docs#risk", "Risk Management"],
            ["/docs#faq", "FAQ"],
          ]}
        />
      </div>

      <div className="border-t" style={{ borderColor: "#333" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-[11px] text-zinc-600 md:flex-row">
          <span>© 2026 AutoTrade Bot. All rights reserved.</span>
          <span>
            Trading involves risk. Paper trading is simulated — nothing here is investment advice.
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-100">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
