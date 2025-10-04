import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const AUTH_ROUTE = "/auth/login";
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

  return res;
}

export const config = {
  runtime: "nodejs",
  matcher: ["/profile/:path*", "/owner/:path*", "/staff/:path*"],
};
