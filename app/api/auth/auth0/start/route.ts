import crypto from "node:crypto";

import { NextResponse } from "next/server";

import {
  AUTH0_PKCE_COOKIE,
  AUTH0_PKCE_MAX_AGE,
  AUTH0_SCOPE,
  createCodeChallenge,
  createCodeVerifier,
  encodePkceSession,
  getAuth0Config,
  resolveAuth0Connection,
} from "@/lib/auth/auth0";

function sanitizeRedirect(input: string | null) {
  if (!input || !input.startsWith("/")) {
    return "/profile";
  }

  return input;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const provider = requestUrl.searchParams.get("provider");
  const connectionOverride = requestUrl.searchParams.get("connection");

  let config;
  try {
    config = getAuth0Config();
  } catch (error) {
    console.error("Auth0 configuration error", error);
    const failure = new URL("/auth/login", requestUrl.origin);
    failure.searchParams.set("error", "auth0_not_configured");
    return NextResponse.redirect(failure);
  }

  const state = crypto.randomUUID();
  const verifier = createCodeVerifier();
  const challenge = createCodeChallenge(verifier);
  const redirectPath = sanitizeRedirect(requestUrl.searchParams.get("redirect"));
  const resolvedConnection = resolveAuth0Connection(config, provider, connectionOverride);

  const callbackUrl = new URL("/api/auth/auth0/callback", requestUrl.origin);
  const authorizeUrl = new URL("/authorize", config.domain);

  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl.toString());
  authorizeUrl.searchParams.set("scope", AUTH0_SCOPE);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  if (config.audience) {
    authorizeUrl.searchParams.set("audience", config.audience);
  }

  if (config.connection) {
    authorizeUrl.searchParams.set("connection", config.connection);
  }

  if (resolvedConnection && resolvedConnection !== config.connection) {
    authorizeUrl.searchParams.set("connection", resolvedConnection);
  }

  const sessionPayload = encodePkceSession({
    state,
    verifier,
    redirect: redirectPath,
    provider: provider?.trim() ?? null,
    connection: resolvedConnection ?? null,
  });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set({
    name: AUTH0_PKCE_COOKIE,
    value: sessionPayload,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: AUTH0_PKCE_MAX_AGE,
    path: "/",
  });

  return response;
}
