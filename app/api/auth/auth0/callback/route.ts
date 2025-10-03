import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/db/types/supabase";
import { env } from "@/lib/env";
import { shouldCompleteLinking } from "@/lib/auth/providers";
import { AUTH0_PKCE_COOKIE, decodePkceSession, getAuth0Config } from "@/lib/auth/auth0";
import { extractAuthErrorMessage } from "@/lib/auth/errors";

function buildErrorRedirect(origin: string, code: string) {
  const url = new URL("/auth/login", origin);
  url.searchParams.set("error", code);
  return url;
}

function mapAuth0LinkError(error: unknown) {
  const message = extractAuthErrorMessage(error);

  if (message.toLowerCase().includes("already in use")) {
    return "auth0_identity_conflict";
  }

  if (message.toLowerCase().includes("sub claim")) {
    return "auth0_missing_user";
  }

  return "auth0_link_failed";
}

function buildCompletionRedirect(origin: string, redirect: string) {
  const url = new URL("/auth/complete", origin);
  if (redirect && redirect !== "/auth/complete") {
    url.searchParams.set("redirect", redirect);
  }
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
    console.error("Auth0 token exchange failed", details);
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_token_exchange_failed"));
  }

  const tokens = (await tokenResponse.json()) as {
    id_token?: string;
    access_token?: string;
    token_type?: string;
  };

  if (!tokens.id_token || !tokens.access_token) {
    console.error("Auth0 token response missing fields", tokens);
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_token_missing"));
  }

  const supabase = createRouteHandlerClient<Database>({ cookies }, {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  let redirectUrl: URL;

  if (sessionData.intent === "link") {
    const { error } = await supabase.auth.linkIdentity({
      provider: "auth0",
      token: tokens.id_token,
      access_token: tokens.access_token,
    } as never);

    if (error) {
      console.error("Failed to link Auth0 identity", error);
      const completionUrl = buildCompletionRedirect(requestUrl.origin, sessionData.redirect);
      completionUrl.searchParams.set("error", mapAuth0LinkError(error));
      completionUrl.searchParams.set("provider", "auth0");
      return NextResponse.redirect(completionUrl);
    }

    redirectUrl = buildCompletionRedirect(requestUrl.origin, sessionData.redirect);
  } else {
    const { error } = await supabase.auth.signInWithIdToken({
      provider: "auth0",
      token: tokens.id_token,
      access_token: tokens.access_token,
    } as never);

    if (error) {
      console.error("Auth0 sign-in failed", error);
      return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_sign_in_failed"));
    }

    const { data, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Failed to load session after Auth0 sign-in", sessionError);
      return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_session_error"));
    }

    const session = data.session ?? null;

    if (shouldCompleteLinking(session)) {
      redirectUrl = buildCompletionRedirect(requestUrl.origin, sessionData.redirect);
    } else {
      redirectUrl = new URL(sessionData.redirect || "/profile", requestUrl.origin);
    }
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set({
    name: AUTH0_PKCE_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
  });
  return response;
}
