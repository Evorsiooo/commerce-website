import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/db/types/supabase";
import { env } from "@/lib/env";
import { AUTH0_PKCE_COOKIE, decodePkceSession, getAuth0Config } from "@/lib/auth/auth0";

type Auth0IdTokenClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
};

function buildErrorRedirect(origin: string, code: string) {
  const url = new URL("/auth/login", origin);
  url.searchParams.set("error", code);
  return url;
}

function decodeJwt<T>(token: string): T {
  const segments = token.split(".");
  if (segments.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const payload = segments[1];
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const decoded = Buffer.from(padded, "base64").toString("utf8");
  return JSON.parse(decoded) as T;
}

function sanitizeEmail(input: string) {
  return input.trim().toLowerCase();
}

function fallbackEmailFromSub(sub: string, provider: string | null) {
  const sanitizedSub = sub.replace(/[^a-zA-Z0-9]+/g, "-");
  const suffix = provider ? provider.replace(/[^a-zA-Z0-9]+/g, "-") : "auth0";
  return `${sanitizedSub}@${suffix}.auth.hccommerce`;
}

function derivePassword(sub: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(sub).digest("hex");
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
  };

  if (!tokens.id_token || !tokens.access_token) {
    console.error("Auth0 token response missing fields", tokens);
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_token_missing"));
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase service role key missing for Auth0 bridge");
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "supabase_service_role_missing"));
  }

  let claims: Auth0IdTokenClaims;
  try {
    claims = decodeJwt<Auth0IdTokenClaims>(tokens.id_token);
  } catch (error) {
    console.error("Failed to decode Auth0 ID token", error);
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_token_invalid"));
  }

  if (!claims?.sub) {
    console.error("Auth0 ID token missing subject", claims);
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_token_invalid"));
  }

  const derivedPassword = derivePassword(claims.sub, env.SUPABASE_SERVICE_ROLE_KEY);
  const resolvedEmail = sanitizeEmail(
    claims.email && claims.email.length > 0
      ? claims.email
      : fallbackEmailFromSub(claims.sub, sessionData.provider ?? sessionData.connection ?? null),
  );
  const displayName = claims.name ?? claims.nickname ?? null;

  const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let existingUserId: string | null = null;
  try {
    const { data: existingUser, error: lookupError } = await supabaseAdmin
      .from("auth.users")
      .select("id")
      .eq("email", resolvedEmail)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    existingUserId = existingUser?.id ?? null;
  } catch (error) {
    console.error("Failed to lookup Supabase user", error);
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "supabase_lookup_failed"));
  }

  const userMetadata = {
    auth0_sub: claims.sub,
    auth0_provider: sessionData.provider ?? null,
    auth0_connection: sessionData.connection ?? null,
    name: displayName,
    picture: claims.picture ?? null,
    email_verified: claims.email_verified ?? null,
  } satisfies Record<string, unknown>;

  if (!existingUserId) {
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: resolvedEmail,
      email_confirm: true,
      password: derivedPassword,
      user_metadata: userMetadata,
      app_metadata: {
        providers: ["auth0"],
      },
    });

    if (createError) {
      console.error("Failed to create Supabase user for Auth0 login", createError);
      return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "supabase_user_create_failed"));
    }
  } else {
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUserId, {
      email: resolvedEmail,
      email_confirm: true,
      password: derivedPassword,
      user_metadata: userMetadata,
    });

    if (updateError) {
      console.error("Failed to update Supabase user for Auth0 login", updateError, {
        userId: existingUserId,
      });
      return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "supabase_user_update_failed"));
    }
  }

  const supabase = createRouteHandlerClient<Database>({ cookies }, {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password: derivedPassword,
  });

  if (error) {
    console.error("Supabase password sign-in failed after Auth0 callback", {
      error,
      provider: sessionData.provider,
      connection: sessionData.connection,
    });
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "supabase_sign_in_failed"));
  }

  const redirectUrl = new URL(sessionData.redirect || "/profile", requestUrl.origin);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set({
    name: AUTH0_PKCE_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
  });
  return response;
}
