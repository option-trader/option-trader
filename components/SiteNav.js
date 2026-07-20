"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bolt, Menu, X } from "./Icons";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed left-4 right-4 top-4 z-50">
      <div className="glass card-3d mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="AutoTrade Bot home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>
            <Bolt className="h-4.5 w-4.5" width="18" height="18" />
          </span>
          <span className="text-base font-black tracking-tight text-zinc-100">
            AutoTrade<span style={{ color: "#D4AF37" }}>Bot</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3.5 py-2 text-sm transition-colors duration-200 ${
                pathname === l.href
                  ? "bg-white/10"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              }`}
              style={pathname === l.href ? { color: "#D4AF37" } : {}}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-sm text-zinc-300 transition-colors duration-200 hover:bg-white/5 hover:text-zinc-100"
          >
            Logout
          </Link>
          <Link
            href="/login?demo=1"
            className="gold-glow rounded-lg px-4 py-2 text-sm font-bold text-black transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: "#D4AF37" }}
          >
            Try Free Demo
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="cursor-pointer rounded-lg p-2 text-zinc-300 transition-colors hover:bg-white/5 md:hidden"
        >
          {open ? <X width="20" height="20" /> : <Menu width="20" height="20" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="glass card-3d mx-auto mt-2 max-w-6xl rounded-2xl p-3 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/5"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2.5 text-center text-sm text-zinc-300" style={{ borderColor: "#444" }}>
              Logout
            </Link>
            <Link href="/login?demo=1" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold text-black" style={{ backgroundColor: "#D4AF37" }}>
              Try Demo
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
