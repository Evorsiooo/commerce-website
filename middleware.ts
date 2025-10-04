import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { clearAuth0SessionCookies } from "@/lib/auth/session";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const AUTH_ROUTE = "/auth/login";
const PROTECTED_PREFIXES = ["/profile", "/owner", "/staff"];

export async function middleware(req: NextRequest) {
  const requiresAuth = PROTECTED_PREFIXES.some((prefix) =>
    req.nextUrl.pathname.startsWith(prefix),
  );

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(req, res);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = AUTH_ROUTE;
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search);

    const response = NextResponse.redirect(redirectUrl);
    clearAuth0SessionCookies(response);
    return response;
  }

  return res;
}

export const config = {
  runtime: "nodejs",
  matcher: ["/profile/:path*", "/owner/:path*", "/staff/:path*"],
};
