import type { Session, User, UserIdentity } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  getProviderStateMap,
  providerLabel,
  shouldCompleteLinking,
} from "@/lib/auth/providers";

function createIdentity(provider: string): UserIdentity {
  return {
    id: `${provider}-identity-row`,
    user_id: "123",
    identity_id: `${provider}-identity`,
    provider,
    identity_data: {},
    last_sign_in_at: "2024-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  } as UserIdentity;
}

function createUser(identities: UserIdentity[]): User {
  const base = {
    id: "123",
    aud: "authenticated",
    email: "test@example.com",
    role: "authenticated",
    created_at: "2024-01-01T00:00:00Z",
    last_sign_in_at: "2024-01-01T00:00:00Z",
    factors: [],
    identities,
    app_metadata: {},
    user_metadata: {},
  } satisfies Record<string, unknown>;

  return base as unknown as User;
}

function createSession(user: User): Session {
  const session = {
    access_token: "token",
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: "refresh",
    user,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  } satisfies Record<string, unknown>;

  return session as unknown as Session;
}

const baseUser = createUser([]);

describe("getProviderStateMap", () => {
  it("marks providers as false when no identities", () => {
    const state = getProviderStateMap(baseUser);
    expect(state.discord.linked).toBe(false);
    expect(state.auth0.linked).toBe(false);
  });

  it("detects linked providers", () => {
    const user = createUser([
      createIdentity("discord"),
      createIdentity("auth0"),
    ]);

    const state = getProviderStateMap(user);
    expect(state.discord.linked).toBe(true);
    expect(state.auth0.linked).toBe(true);
  });
});

describe("shouldCompleteLinking", () => {
  it("returns true when a provider is missing", () => {
    const session = createSession(createUser([createIdentity("discord")]));

    expect(shouldCompleteLinking(session)).toBe(true);
  });

  it("returns false when all providers present", () => {
    const session = createSession(
      createUser([
        createIdentity("discord"),
        createIdentity("auth0"),
      ]),
    );

    expect(shouldCompleteLinking(session)).toBe(false);
  });
});

describe("providerLabel", () => {
  it("maps auth0 to Roblox", () => {
    expect(providerLabel("auth0")).toBe("Roblox");
  });

  it("maps discord to Discord", () => {
    expect(providerLabel("discord")).toBe("Discord");
  });
});
