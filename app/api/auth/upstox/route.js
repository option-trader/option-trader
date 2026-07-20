// POST /api/auth/upstox  { code }
// Exchanges the OAuth authorization code for an access token (secret stays
// server-side), stores it in an encrypted httpOnly cookie, and persists a
// record to Supabase when configured.
import { NextResponse } from "next/server";
import { setUpstoxSession, isUpstoxConfigured } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { saveTokenRecord } from "@/lib/supabase";

export async function POST(request) {
  const rl = rateLimit(`auth:${clientIp(request)}`, { max: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts, try again in a minute" }, { status: 429 });
  }

  if (!isUpstoxConfigured()) {
    return NextResponse.json({ error: "Upstox keys not configured on server" }, { status: 503 });
  }

  let code;
  try {
    ({ code } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!code || typeof code !== "string" || code.length > 512) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  try {
    // Upstox token endpoint expects application/x-www-form-urlencoded
    const body = new URLSearchParams({
      code,
      client_id: process.env.NEXT_PUBLIC_UPSTOX_API_KEY,
      client_secret: process.env.UPSTOX_API_SECRET,
      redirect_uri: process.env.NEXT_PUBLIC_UPSTOX_REDIRECT_URL || "http://localhost:3000/auth/callback",
      grant_type: "authorization_code",
    });

    const res = await fetch("https://api.upstox.com/v2/login/authorization/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
    });

    const data = await res.json();
    if (!res.ok || !data.access_token) {
      console.error("[auth] token exchange failed:", data);
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // Upstox tokens are valid until ~3:30 AM next day; 24h cookie is a safe ceiling.
    setUpstoxSession(data.access_token, 60 * 60 * 24);

    // Best-effort persistence (no-op if Supabase isn't configured yet)
    await saveTokenRecord({
      upstoxUserId: data.user_id || null,
      userName: data.user_name || null,
      email: data.email || null,
      accessToken: data.access_token,
    }).catch((e) => console.error("[auth] supabase save failed:", e.message));

    return NextResponse.json({ success: true, user_name: data.user_name || null });
  } catch (error) {
    console.error("[auth] token exchange error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
