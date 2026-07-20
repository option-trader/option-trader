// Route protection: /dashboard requires a session cookie (demo or upstox).
// Token validity is checked server-side in the API routes; here we only gate
// on cookie presence so the middleware stays edge-safe (no crypto imports).
import { NextResponse } from "next/server";

export function middleware(request) {
  const mode = request.cookies.get("at_mode")?.value;
  if (!mode) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
