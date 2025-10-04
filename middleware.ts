import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { clearAuth0SessionCookies, readAuth0SessionFromRequest } from "@/lib/auth/session";

const AUTH_ROUTE = "/auth/login";
const PROTECTED_PREFIXES = ["/profile", "/owner", "/staff"];

export async function middleware(req: NextRequest) {
  const requiresAuth = PROTECTED_PREFIXES.some((prefix) =>
    req.nextUrl.pathname.startsWith(prefix),
  );

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const session = await readAuth0SessionFromRequest(req);

  if (!session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = AUTH_ROUTE;
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search);

    const response = NextResponse.redirect(redirectUrl);
    clearAuth0SessionCookies(response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/profile/:path*", "/owner/:path*", "/staff/:path*"],
};
