import type { Session, User } from "@supabase/supabase-js";

const REQUIRED_PROVIDERS = ["discord", "auth0"] as const;

type ProviderId = typeof REQUIRED_PROVIDERS[number];

export type ProviderLinkState = Record<ProviderId, boolean>;

export function resolveLinkedProviders(user: User | null): ProviderLinkState {
  const identities = user?.identities ?? [];
  const providerMap = new Map<ProviderId, boolean>(REQUIRED_PROVIDERS.map((provider) => [provider, false]));

  for (const identity of identities) {
    const provider = identity?.provider as ProviderId | undefined;
    if (provider && providerMap.has(provider)) {
      providerMap.set(provider, true);
    }
  }

  return Object.fromEntries(providerMap.entries()) as ProviderLinkState;
}

export function needsLinking(session: Session | null): boolean {
  const state = resolveLinkedProviders(session?.user ?? null);
  return REQUIRED_PROVIDERS.some((provider) => !state[provider]);
}

export function providerLabel(provider: ProviderId): string {
  switch (provider) {
    case "discord":
      return "Discord";
    case "auth0":
      return "Roblox";
    default:
      return provider;
  }
}

export const REQUIRED_PROVIDER_LABELS = REQUIRED_PROVIDERS.map(providerLabel);
