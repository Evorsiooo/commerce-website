import { NextResponse } from "next/server";

import { clearAuth0SessionCookies } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearAuth0SessionCookies(response);
  return response;
}