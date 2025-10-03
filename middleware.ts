import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { shouldCompleteLinking } from "@/lib/auth/providers";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const AUTH_ROUTE = "/auth/login";
const COMPLETE_ROUTE = "/auth/complete";
const PROTECTED_PREFIXES = ["/profile", "/owner", "/staff"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(req, res);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const requiresAuth = PROTECTED_PREFIXES.some((prefix) =>
    req.nextUrl.pathname.startsWith(prefix),
  );

  if (!session && requiresAuth) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = AUTH_ROUTE;
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  if (!session) {
    return res;
  }

  const mustCompleteLinking = shouldCompleteLinking(session);
  const onCompletionRoute = req.nextUrl.pathname.startsWith(COMPLETE_ROUTE);

  if (mustCompleteLinking && !onCompletionRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = COMPLETE_ROUTE;
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  if (!mustCompleteLinking && onCompletionRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/profile";
    redirectUrl.searchParams.delete("redirect");
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  runtime: "nodejs",
  matcher: ["/profile/:path*", "/owner/:path*", "/staff/:path*", "/auth/complete"],
};
