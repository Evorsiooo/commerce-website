import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { needsLinking } from "@/lib/auth/linking";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const AUTH_ROUTE = "/auth/login";
const LINK_ROUTE = "/auth/link-accounts";
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

  const mustLink = needsLinking(session);
  const onLinkRoute = req.nextUrl.pathname.startsWith(LINK_ROUTE);

  if (mustLink && !onLinkRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = LINK_ROUTE;
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  if (!mustLink && onLinkRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/profile";
    redirectUrl.searchParams.delete("redirect");
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/profile/:path*", "/owner/:path*", "/staff/:path*", "/auth/link-accounts"],
};
