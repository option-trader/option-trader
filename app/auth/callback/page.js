"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState("Connecting to Upstox…");
  const exchanged = useRef(false); // guard against double-run (StrictMode / re-render)

  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      router.replace("/?error=no_code");
      return;
    }
    if (exchanged.current) return;
    exchanged.current = true;

    setStatus("Exchanging authorization code…");
    fetch("/api/auth/upstox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || "auth_failed");
        setStatus("Success! Loading dashboard…");
        router.replace("/dashboard");
      })
      .catch(() => router.replace("/?error=auth_failed"));
  }, [params, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="rounded-2xl border border-ink-500 bg-ink-800 px-10 py-8 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <p className="text-sm text-zinc-300">{status}</p>
      </div>
    </main>
  );
}
