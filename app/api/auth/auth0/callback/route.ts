import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { AUTH0_PKCE_COOKIE, decodePkceSession, getAuth0Config } from "@/lib/auth/auth0";
import { setAuth0SessionCookies, verifyAuth0IdToken } from "@/lib/auth/session";

function buildErrorRedirect(origin: string, code: string) {
  const url = new URL("/auth/login", origin);
  url.searchParams.set("error", code);
  return url;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_missing_params"));
  }

  const cookieStore = await cookies();
  const pkceCookie = cookieStore.get(AUTH0_PKCE_COOKIE);

  if (!pkceCookie) {
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_session_expired"));
  }

  let sessionData;
  try {
    sessionData = decodePkceSession(pkceCookie.value);
  } catch (error) {
    console.error("Failed to parse Auth0 PKCE session", error);
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_state_mismatch"));
  }

  if (sessionData.state !== state) {
    console.error("Auth0 state mismatch", { expected: sessionData.state, received: state });
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_state_mismatch"));
  }

  let config;
  try {
    config = getAuth0Config();
  } catch (error) {
    console.error("Auth0 configuration error", error);
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_not_configured"));
  }

  const tokenUrl = new URL("/oauth/token", config.domain);
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: new URL("/api/auth/auth0/callback", requestUrl.origin).toString(),
    code_verifier: sessionData.verifier,
  });

  if (config.audience) {
    tokenBody.set("audience", config.audience);
  }

  const tokenResponse = await fetch(tokenUrl.toString(), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: tokenBody.toString(),
  });

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text();
    console.error("Auth0 token exchange failed", {
      details,
      provider: sessionData.provider,
      connection: sessionData.connection,
    });
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_token_exchange_failed"));
  }

  const tokens = (await tokenResponse.json()) as {
    id_token?: string;
    access_token?: string;
    token_type?: string;
    expires_in?: number;
  };

  if (!tokens.id_token || !tokens.access_token) {
    console.error("Auth0 token response missing fields", tokens);
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_token_missing"));
  }

  try {
    await verifyAuth0IdToken(tokens.id_token);
  } catch (error) {
    console.error("Auth0 ID token verification failed", {
      error,
      provider: sessionData.provider,
      connection: sessionData.connection,
    });
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_invalid_token"));
  }

  const expiresIn = typeof tokens.expires_in === "number" ? tokens.expires_in : 3600;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  const redirectUrl = new URL(sessionData.redirect || "/profile", requestUrl.origin);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set({
    name: AUTH0_PKCE_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
  });

  setAuth0SessionCookies(response, {
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    expiresAt,
    provider: sessionData.provider ?? null,
    connection: sessionData.connection ?? null,
  });

  return response;
}
