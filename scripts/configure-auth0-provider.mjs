#!/usr/bin/env node

import process from "node:process";

function getEnv(name, { required = true } = {}) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    if (required) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return undefined;
  }
  return value.trim();
}

async function main() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const auth0Domain = getEnv("AUTH0_DOMAIN");
  const auth0ClientId = getEnv("AUTH0_CLIENT_ID");
  const auth0ClientSecret = getEnv("AUTH0_CLIENT_SECRET");

  const issuer = auth0Domain.startsWith("http") ? auth0Domain : `https://${auth0Domain}`;
  const normalizedIssuer = issuer.endsWith("/") ? issuer : `${issuer}/`;

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const endpoint = `${supabaseUrl}/auth/v1/admin/sso/providers`;

  const response = await fetch(endpoint, { headers });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to list Supabase SSO providers: ${response.status} ${details}`);
  }

  const providers = await response.json();
  const slug = "auth0";
  const payload = {
    type: "oidc",
    slug,
    name: "Auth0",
    domains: [],
    metadata: {
      issuer: normalizedIssuer,
      authorization_endpoint: `${normalizedIssuer}authorize`,
      token_endpoint: `${normalizedIssuer}oauth/token`,
      userinfo_endpoint: `${normalizedIssuer}userinfo`,
      jwks_uri: `${normalizedIssuer}.well-known/jwks.json`,
      client_id: auth0ClientId,
      client_secret: auth0ClientSecret,
      scopes: ["openid", "profile", "email"],
    },
    attribute_mapping: {
      keys: {
        user_id: "sub",
        email: "email",
        email_verified: "email_verified",
        full_name: "name",
        picture: "picture",
      },
    },
    enabled: true,
  };

  const existing = Array.isArray(providers)
    ? providers.find((provider) => provider.slug === slug || provider.metadata?.issuer === normalizedIssuer)
    : undefined;

  if (existing) {
    const updateResponse = await fetch(`${endpoint}/${existing.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });

    if (!updateResponse.ok) {
      const details = await updateResponse.text();
      throw new Error(`Failed to update Auth0 provider: ${updateResponse.status} ${details}`);
    }

    console.log(`Updated existing Supabase Auth0 provider (id=${existing.id}).`);
    return;
  }

  const createResponse = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!createResponse.ok) {
    const details = await createResponse.text();
    throw new Error(`Failed to create Auth0 provider: ${createResponse.status} ${details}`);
  }

  console.log("Created Supabase Auth0 provider.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
