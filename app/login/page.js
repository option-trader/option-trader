"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Bolt, Lock, Eye } from "@/components/Icons";

const ERRORS = {
  auth_failed: "Upstox login failed. Please try again.",
  no_code: "Upstox did not return an authorization code.",
  not_configured: "Upstox API keys are not configured yet — use Demo Mode, or add keys to .env.local.",
  session_expired: "Your session expired. Please log in again.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(true);
  const [upstoxConfigured, setUpstoxConfigured] = useState(false);

  const enterDemo = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        body: JSON.stringify({ mode: "demo" }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        // Small delay to ensure cookie is set before navigation
        await new Promise((r) => setTimeout(r, 200));
        router.push("/dashboard");
      }
    } catch {
      // Fallback: navigate anyway — dashboard will check session
      router.push("/dashboard");
    }
  };

  useEffect(() => {
    const err = params.get("error");
    if (err) setError(ERRORS[err] || "Something went wrong. Please try again.");
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        setUpstoxConfigured(!!s.upstoxConfigured);
        if (s.authenticated) {
          router.replace("/dashboard");
        } else if (params.get("demo") === "1") {
          enterDemo(); // came from a "Try Demo" CTA — go straight in
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, router]);

  const loginWithUpstox = () => {
    const clientId = process.env.NEXT_PUBLIC_UPSTOX_API_KEY;
    const redirect = process.env.NEXT_PUBLIC_UPSTOX_REDIRECT_URL || `${window.location.origin}/auth/callback`;
    if (!clientId) {
      setError(ERRORS.not_configured);
      return;
    }
    const url =
      `https://api.upstox.com/v2/login/authorization/dialog` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirect)}` +
      `&response_type=code`;
    window.location.href = url;
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="hero-grid absolute inset-0" />
      <div className="glow-orb left-1/4 top-1/4 h-72 w-72 bg-gold/10" />
      <div className="glow-orb bottom-1/4 right-1/4 h-72 w-72 bg-bull/10" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass card-3d relative w-full max-w-md rounded-2xl p-8 text-center"
      >
        <Link href="/" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <Bolt width="22" height="22" />
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-zinc-100">
          Welcome to <span className="text-gradient-gold">AutoTrade Bot</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-400">Automated Trading Made Simple</p>

        {error && (
          <div className="mt-5 rounded-lg border border-bear/40 bg-bear/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-3">
          <button
            onClick={loginWithUpstox}
            disabled={checking}
            className="gold-glow flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-ink-900 transition-all duration-200 hover:bg-gold-light disabled:opacity-50"
          >
            <Lock width="16" height="16" /> LOGIN WITH UPSTOX
          </button>
          <button
            onClick={enterDemo}
            disabled={checking}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink-400 bg-ink-700 py-3 text-sm font-bold text-zinc-200 transition-all duration-200 hover:border-gold/50 disabled:opacity-50"
          >
            <Eye width="16" height="16" /> TRY DEMO (PAPER TRADING)
          </button>
        </div>

        <p className="mt-4 text-[11px] text-zinc-500">
          Connect your Upstox account securely — credentials never touch our servers.
          {!upstoxConfigured && !checking && (
            <span className="mt-1 block text-amber-500/80">Upstox keys not configured — Demo Mode available.</span>
          )}
        </p>

        <div className="mt-6 flex justify-center gap-4 text-[11px] text-zinc-500">
          <Link href="/terms" className="transition-colors hover:text-gold">Terms of Service</Link>
          <span>·</span>
          <Link href="/privacy" className="transition-colors hover:text-gold">Privacy Policy</Link>
        </div>
      </motion.div>
    </main>
  );
}
