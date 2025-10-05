import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/db/types/supabase";
import { env } from "@/lib/env";
import { AUTH0_PKCE_COOKIE, decodePkceSession, getAuth0Config } from "@/lib/auth/auth0";

function buildErrorRedirect(origin: string, code: string) {
  const url = new URL("/auth/login", origin);
  url.searchParams.set("error", code);
  return url;
}

type Auth0IdTokenClaims = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  [key: string]: unknown;
};

function decodeAuth0IdToken(token: string): Auth0IdTokenClaims {
  const parts = token.split(".");

  if (parts.length < 2) {
    throw new Error("Invalid Auth0 id_token");
  }

  const payloadSegment = parts[1];
  const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const decoded = Buffer.from(padded, "base64").toString("utf8");

  try {
    const parsed = JSON.parse(decoded) as Auth0IdTokenClaims;
    return parsed;
  } catch (error) {
    console.error("Failed to parse Auth0 id_token payload", error);
    throw new Error("Invalid Auth0 id_token payload");
  }
}

function resolveAuth0Email(claims: Auth0IdTokenClaims, provider: string | null | undefined) {
  const claimedEmail = typeof claims.email === "string" ? claims.email.trim() : "";
  if (claimedEmail.includes("@")) {
    return claimedEmail.toLowerCase();
  }

  const sub = typeof claims.sub === "string" ? claims.sub : null;
  if (!sub) {
    return null;
  }

  const sanitizedSub = sub.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const sanitizedProvider = provider?.trim().toLowerCase() || "auth0";
  return `${sanitizedSub}@${sanitizedProvider}.internal.auth`; // deterministic synthetic email
}

function buildUserMetadata(
  claims: Auth0IdTokenClaims,
  provider: string | null | undefined,
  connection: string | null | undefined,
) {
  const metadata: Record<string, unknown> = {
    auth_provider: provider ?? "auth0",
  };

  if (connection) {
    metadata.auth_connection = connection;
  }

  if (claims.sub) {
    metadata.auth0_sub = claims.sub;
  }

  if (claims.email) {
    metadata.auth0_email = claims.email;
  }

  if (typeof claims.email_verified === "boolean") {
    metadata.auth0_email_verified = claims.email_verified;
  }

  if (claims.name) {
    metadata.auth0_name = claims.name;
  }

  if (claims.picture) {
    metadata.auth0_picture = claims.picture;
  }

  if (claims.nickname) {
    metadata.auth0_nickname = claims.nickname;
  }

  if (claims.given_name) {
    metadata.auth0_given_name = claims.given_name;
  }

  if (claims.family_name) {
    metadata.auth0_family_name = claims.family_name;
  }

  return metadata;
}

function extractMagicLinkToken(actionLink: string | null | undefined) {
  if (!actionLink) {
    return null;
  }

  try {
    const url = new URL(actionLink);
    return url.searchParams.get("token");
  } catch (error) {
    console.error("Failed to parse Supabase action link token", { actionLink, error });
    return null;
  }
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

  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error("Supabase service role key is required for Auth0 login");
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "supabase_service_role_missing"));
  }

  const auth0Claims = decodeAuth0IdToken(tokens.id_token);
  const normalizedEmail = resolveAuth0Email(auth0Claims, sessionData.provider);

  if (!normalizedEmail) {
    console.error("Failed to derive email from Auth0 id_token", {
      claims: auth0Claims,
      provider: sessionData.provider,
      connection: sessionData.connection,
    });
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "auth0_email_missing"));
  }

  const supabaseAdmin = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const userMetadataPatch = buildUserMetadata(auth0Claims, sessionData.provider, sessionData.connection);

  const linkResult = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: normalizedEmail,
    options: {
      data: userMetadataPatch,
    },
  });

  if (linkResult.error || !linkResult.data?.properties) {
    console.error("Supabase magic link generation failed", {
      error: linkResult.error,
      provider: sessionData.provider,
      connection: sessionData.connection,
    });
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "supabase_magiclink_failed"));
  }

  const { properties, user: generatedUser } = linkResult.data;
  const emailOtp = properties.email_otp ?? null;
  const magicToken = extractMagicLinkToken(properties.action_link ?? null);
  const verificationToken = emailOtp ?? magicToken;
  const verificationType = emailOtp ? "email" : ("magiclink" as const);

  if (!verificationToken) {
    console.error("Supabase magic link payload missing token", {
      provider: sessionData.provider,
      connection: sessionData.connection,
    });
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "supabase_magiclink_missing_token"));
  }

  if (generatedUser?.id) {
    const mergedMetadata = {
      ...(generatedUser.user_metadata ?? {}),
      ...userMetadataPatch,
    };

    if (Object.keys(mergedMetadata).length > 0) {
      const updateResult = await supabaseAdmin.auth.admin.updateUserById(generatedUser.id, {
        email_confirm: true,
        user_metadata: mergedMetadata,
      });

      if (updateResult.error) {
        console.error("Supabase user metadata update failed", {
          error: updateResult.error,
          provider: sessionData.provider,
          connection: sessionData.connection,
          userId: generatedUser.id,
        });
      }
    }
  }

  const supabase = createRouteHandlerClient<Database>({ cookies }, {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  const otpResponse = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token: verificationToken,
    type: verificationType,
  });

  if (otpResponse.error || !otpResponse.data.session) {
    console.error("Supabase email OTP verification failed", {
      error: otpResponse.error,
      provider: sessionData.provider,
      connection: sessionData.connection,
    });
    return NextResponse.redirect(buildErrorRedirect(requestUrl.origin, "supabase_email_verify_failed"));
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
