import crypto from "node:crypto";

import { NextResponse } from "next/server";

import {
  AUTH0_PKCE_COOKIE,
  AUTH0_PKCE_MAX_AGE,
  AUTH0_SCOPE,
  type Auth0Intent,
  createCodeChallenge,
  createCodeVerifier,
  encodePkceSession,
  getAuth0Config,
} from "@/lib/auth/auth0";

function sanitizeRedirect(input: string | null) {
  if (!input || !input.startsWith("/")) {
    return "/profile";
  }

  return input;
}

function parseIntent(value: string | null): Auth0Intent {
  return value === "link" ? "link" : "login";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

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
  const intent = parseIntent(requestUrl.searchParams.get("intent"));

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

  const prompt = intent === "link" ? "login" : "select_account";
  authorizeUrl.searchParams.set("prompt", prompt);

  const sessionPayload = encodePkceSession({
    state,
    verifier,
    redirect: redirectPath,
    intent,
  });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set({
    name: AUTH0_PKCE_COOKIE,
    value: sessionPayload,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: AUTH0_PKCE_MAX_AGE,
    path: "/",
  });

  return response;
}
