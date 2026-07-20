// Supabase server client — degrades to a no-op when env vars are absent so
// the whole app works keyless. Uses plain REST (PostgREST) to avoid adding
// the supabase-js dependency until it's actually needed.
import { encrypt, isEncryptionConfigured } from "./encryption";

export function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function sbFetch(path, { method = "GET", body } = {}) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(url, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path} failed: ${res.status} ${await res.text()}`);
}

// Store an encrypted token record after OAuth login. No-op until Supabase is configured.
export async function saveTokenRecord({ upstoxUserId, userName, email, accessToken }) {
  if (!isSupabaseConfigured()) return;
  const token = isEncryptionConfigured() ? encrypt(accessToken) : null; // never store plaintext
  await sbFetch("user_tokens", {
    method: "POST",
    body: {
      upstox_user_id: upstoxUserId,
      user_name: userName,
      email,
      token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
}

// Persist a trade (paper or live). No-op until Supabase is configured.
export async function saveTrade(trade) {
  if (!isSupabaseConfigured()) return;
  await sbFetch("trades", { method: "POST", body: trade });
}

// Persist an activity log entry. No-op until Supabase is configured.
export async function saveActivityLog(entry) {
  if (!isSupabaseConfigured()) return;
  await sbFetch("activity_logs", { method: "POST", body: entry });
}
