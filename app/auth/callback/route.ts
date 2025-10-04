import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectPath = requestUrl.searchParams.get("redirect") ?? "/profile";
  const target = new URL("/auth/login", requestUrl.origin);
  target.searchParams.set("redirect", redirectPath);
  target.searchParams.set("error", "auth0_not_configured");
  return NextResponse.redirect(target);
}
