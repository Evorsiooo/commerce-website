import { cookies } from "next/headers";

export const AUTH0_SESSION_COOKIE = "auth0_session";
export const AUTH0_SESSION_COOKIE_OPTIONS = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const AUTH0_SESSION_COOKIE_CLEAR = {
  name: AUTH0_SESSION_COOKIE,
  value: "",
  maxAge: 0,
  path: "/",
};

export type Auth0Session = {
  accessToken: string;
  idToken: string;
  expiresAt: number; // epoch seconds
  tokenType: string;
  scope?: string | null;
  provider?: string | null;
  connection?: string | null;
};

export function encodeAuth0Session(session: Auth0Session) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function createAuth0SessionCookie(session: Auth0Session) {
  return {
    name: AUTH0_SESSION_COOKIE,
    value: encodeAuth0Session(session),
    maxAge: getAuth0SessionCookieMaxAge(session.expiresAt),
    ...AUTH0_SESSION_COOKIE_OPTIONS,
  };
}

export function decodeAuth0Session(value: string): Auth0Session {
  const decoded = Buffer.from(value, "base64url").toString("utf8");
  const parsed = JSON.parse(decoded);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid Auth0 session payload");
  }

  const { accessToken, idToken, expiresAt, tokenType, scope, provider, connection } = parsed as Partial<Auth0Session>;

  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("Auth0 session missing accessToken");
  }

  if (typeof idToken !== "string" || idToken.length === 0) {
    throw new Error("Auth0 session missing idToken");
  }

  if (typeof expiresAt !== "number") {
    throw new Error("Auth0 session missing expiresAt");
  }

  if (typeof tokenType !== "string" || tokenType.length === 0) {
    throw new Error("Auth0 session missing tokenType");
  }

  return {
    accessToken,
    idToken,
    expiresAt,
    tokenType,
    scope: scope ?? null,
    provider: provider ?? null,
    connection: connection ?? null,
  } satisfies Auth0Session;
}

export function getAuth0SessionCookieMaxAge(expiresAt: number) {
  const now = Math.floor(Date.now() / 1000);
  const ttl = expiresAt - now;
  return ttl > 0 ? ttl : 0;
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export async function getAuth0SessionFromCookies(cookieStore?: CookieStore) {
  const store = cookieStore ?? (await cookies());
  const sessionCookie = store.get(AUTH0_SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = decodeAuth0Session(sessionCookie.value);
    const maxAge = getAuth0SessionCookieMaxAge(session.expiresAt);
    if (maxAge <= 0) {
      return null;
    }
    return session;
  } catch (error) {
    console.error("Failed to parse Auth0 session cookie", error);
    return null;
  }
}
