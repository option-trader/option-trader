// GET  /api/auth/session — report auth state (never exposes the token)
// POST /api/auth/session — { mode: "demo" } starts a demo session
import { NextResponse } from "next/server";
import { getSession, setDemoSession, isUpstoxConfigured } from "@/lib/session";

export async function GET() {
  const session = getSession();
  return NextResponse.json({
    authenticated: session.authenticated,
    mode: session.mode,
    upstoxConfigured: isUpstoxConfigured(),
  });
}

export async function POST(request) {
  try {
    const { mode } = await request.json();
    if (mode !== "demo") {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
    setDemoSession();
    return NextResponse.json({ success: true, mode: "demo" });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
