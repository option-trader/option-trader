// Server-side session helpers built on httpOnly cookies.
// Two cookies:
//   at_mode      "demo" | "upstox"          — which auth mode is active
//   upstox_token encrypted access token     — only set in upstox mode
import { cookies } from "next/headers";
import { encrypt, decrypt, isEncryptionConfigured } from "./encryption";

const MODE_COOKIE = "at_mode";
const TOKEN_COOKIE = "upstox_token";
const DAY = 60 * 60 * 24;

const base = {
  httpOnly: true,
  sameSite: "lax", // lax (not strict) so the OAuth redirect back from Upstox carries cookies
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: DAY,
};

export function setDemoSession() {
  cookies().set(MODE_COOKIE, "demo", base);
  cookies().delete(TOKEN_COOKIE);
}

export function setUpstoxSession(accessToken, expiresIn = DAY) {
  const stored = isEncryptionConfigured() ? `enc:${encrypt(accessToken)}` : `raw:${accessToken}`;
  cookies().set(MODE_COOKIE, "upstox", { ...base, maxAge: expiresIn });
  cookies().set(TOKEN_COOKIE, stored, { ...base, maxAge: expiresIn });
}

export function clearSession() {
  cookies().delete(MODE_COOKIE);
  cookies().delete(TOKEN_COOKIE);
}

export function getSession() {
  const mode = cookies().get(MODE_COOKIE)?.value || null;
  if (!mode) return { authenticated: false, mode: null };
  if (mode === "demo") return { authenticated: true, mode: "demo" };

  const stored = cookies().get(TOKEN_COOKIE)?.value;
  if (!stored) return { authenticated: false, mode: null };
  try {
    const token = stored.startsWith("enc:") ? decrypt(stored.slice(4)) : stored.slice(4);
    return { authenticated: true, mode: "upstox", accessToken: token };
  } catch {
    return { authenticated: false, mode: null };
  }
}

export function isUpstoxConfigured() {
  return !!(process.env.NEXT_PUBLIC_UPSTOX_API_KEY && process.env.UPSTOX_API_SECRET);
}
