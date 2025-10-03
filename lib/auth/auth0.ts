import crypto from "node:crypto";

import { env } from "@/lib/env";

export type Auth0PkceSession = {
  state: string;
  verifier: string;
  redirect: string;
};

export const AUTH0_PKCE_COOKIE = "auth0_pkce";
export const AUTH0_PKCE_MAX_AGE = 60 * 5; // five minutes
export const AUTH0_SCOPE = "openid profile";

export function getAuth0Config() {
  const domain = env.AUTH0_DOMAIN;
  const clientId = env.AUTH0_CLIENT_ID;
  const clientSecret = env.AUTH0_CLIENT_SECRET;
  const audience = env.AUTH0_AUDIENCE;
  const connection = env.AUTH0_CONNECTION;

  if (!domain || !clientId || !clientSecret) {
    throw new Error("Auth0 environment variables are not fully configured.");
  }

  const normalizedDomain = normalizeAuth0Domain(domain);

  return {
    domain: normalizedDomain,
    clientId,
    clientSecret,
    audience: audience?.trim() ?? undefined,
    connection: connection?.trim() ?? undefined,
  };
}

function normalizeAuth0Domain(rawDomain: string) {
  const trimmed = rawDomain.trim().replace(/\/$/, "");

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function createCodeVerifier() {
  return base64UrlEncode(crypto.randomBytes(32));
}

export function createCodeChallenge(verifier: string) {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return base64UrlEncode(hash);
}

export function encodePkceSession(session: Auth0PkceSession) {
  const payload = JSON.stringify(session);
  return base64UrlEncode(Buffer.from(payload, "utf8"));
}

export function decodePkceSession(value: string): Auth0PkceSession {
  const buffer = base64UrlDecode(value);
  const parsed = JSON.parse(buffer.toString("utf8"));
  if (
    !parsed ||
    typeof parsed.state !== "string" ||
    typeof parsed.verifier !== "string" ||
    typeof parsed.redirect !== "string"
  ) {
    throw new Error("Invalid Auth0 PKCE session payload");
  }

  return parsed as Auth0PkceSession;
}

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64");
}
