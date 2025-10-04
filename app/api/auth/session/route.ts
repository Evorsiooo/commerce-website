import { NextResponse } from "next/server";

import { readAuth0SessionFromCookies } from "@/lib/auth/session";

function inferProvider(sub: string): string | null {
  if (!sub) {
    return null;
  }

  const [maybeProvider] = sub.split("|");
  return maybeProvider ?? null;
}

export async function GET() {
  const session = await readAuth0SessionFromCookies();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const claims = session.claims;
  const provider = session.provider ?? inferProvider(claims.sub);

  return NextResponse.json({
    authenticated: true,
    expiresAt: session.expiresAt,
    provider,
    connection: session.connection,
    user: {
      id: claims.sub,
      name: typeof claims.name === "string" ? claims.name : null,
      nickname: typeof claims.nickname === "string" ? claims.nickname : null,
      picture: typeof claims.picture === "string" ? claims.picture : null,
      email: typeof claims.email === "string" ? claims.email : null,
      roles: Array.isArray((claims as Record<string, unknown>).roles)
        ? ((claims as Record<string, unknown>).roles as unknown[]).map(String)
        : null,
      raw: claims,
    },
  });
}