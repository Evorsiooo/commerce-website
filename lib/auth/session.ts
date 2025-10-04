import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { getAuth0Config } from "@/lib/auth/auth0";

export const AUTH0_ACCESS_COOKIE = "auth0_access_token";
export const AUTH0_ID_COOKIE = "auth0_id_token";
export const AUTH0_EXPIRES_COOKIE = "auth0_expires_at";
export const AUTH0_PROVIDER_COOKIE = "auth0_provider";
export const AUTH0_CONNECTION_COOKIE = "auth0_connection";

export type Auth0Session = {
  accessToken: string;
  idToken: string;
  expiresAt: number;
  provider: string | null;
  connection: string | null;
  claims: Record<string, unknown> & { sub: string };
};

type CookieStoreLike = {
  get(name: string): { value: string | undefined } | undefined;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    const { domain } = getAuth0Config();
    jwks = createRemoteJWKSet(new URL("/.well-known/jwks.json", domain));
  }

  return jwks;
}

function decodeCookieValue(value: string | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function verifyAuth0IdToken(idToken: string) {
  const { clientId, domain } = getAuth0Config();

  const result = await jwtVerify(idToken, getJwks(), {
    issuer: `${domain}/`,
    audience: clientId,
  });

  return result.payload as Record<string, unknown> & { sub: string };
}

export async function readAuth0SessionFromCookies(
  store?: CookieStoreLike | Promise<CookieStoreLike>,
): Promise<Auth0Session | null> {
  const cookieStore = store ? await store : await cookies();

  const accessToken = decodeCookieValue(cookieStore.get(AUTH0_ACCESS_COOKIE)?.value);
  const idToken = decodeCookieValue(cookieStore.get(AUTH0_ID_COOKIE)?.value);
  const expiresAtValue = decodeCookieValue(cookieStore.get(AUTH0_EXPIRES_COOKIE)?.value);
  const provider = decodeCookieValue(cookieStore.get(AUTH0_PROVIDER_COOKIE)?.value) ?? null;
  const connection = decodeCookieValue(cookieStore.get(AUTH0_CONNECTION_COOKIE)?.value) ?? null;

  if (!accessToken || !idToken || !expiresAtValue) {
    return null;
  }

  const expiresAt = Number.parseInt(expiresAtValue, 10);

  if (Number.isNaN(expiresAt) || expiresAt * 1000 < Date.now()) {
    return null;
  }

  try {
    const claims = await verifyAuth0IdToken(idToken);
    return {
      accessToken,
      idToken,
      expiresAt,
      provider,
      connection,
      claims,
    } satisfies Auth0Session;
  } catch (error) {
    console.error("Failed to verify Auth0 ID token", error);
    return null;
  }
}

export async function readAuth0SessionFromRequest(req: NextRequest): Promise<Auth0Session | null> {
  return readAuth0SessionFromCookies(req.cookies);
}

function buildCookieHeader(name: string, value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production";
  const encodedValue = encodeURIComponent(value);
  const parts = [
    `${name}=${encodedValue}`,
    `Max-Age=${Math.max(0, maxAge)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function setAuth0SessionCookies(response: Response, session: {
  accessToken: string;
  idToken: string;
  expiresAt: number;
  provider: string | null | undefined;
  connection: string | null | undefined;
}) {
  const maxAge = Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000));

  response.headers.append("Set-Cookie", buildCookieHeader(AUTH0_ACCESS_COOKIE, session.accessToken, maxAge));
  response.headers.append("Set-Cookie", buildCookieHeader(AUTH0_ID_COOKIE, session.idToken, maxAge));
  response.headers.append("Set-Cookie", buildCookieHeader(AUTH0_EXPIRES_COOKIE, String(session.expiresAt), maxAge));
  response.headers.append("Set-Cookie", buildCookieHeader(AUTH0_PROVIDER_COOKIE, session.provider ?? "", maxAge));
  response.headers.append("Set-Cookie", buildCookieHeader(AUTH0_CONNECTION_COOKIE, session.connection ?? "", maxAge));

  return response;
}

export function clearAuth0SessionCookies(response: Response) {
  for (const name of [
    AUTH0_ACCESS_COOKIE,
    AUTH0_ID_COOKIE,
    AUTH0_EXPIRES_COOKIE,
    AUTH0_PROVIDER_COOKIE,
    AUTH0_CONNECTION_COOKIE,
  ]) {
    response.headers.append("Set-Cookie", buildCookieHeader(name, "", 0));
  }

  return response;
}

export async function requireAuth0Session() {
  const session = await readAuth0SessionFromCookies();
  if (!session) {
    throw new Error("Auth0 session missing");
  }
  return session;
}