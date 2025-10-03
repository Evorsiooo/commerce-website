import type { Session, User, UserIdentity } from "@supabase/supabase-js";

export const AUTH_PROVIDERS = [
  { id: "discord", label: "Discord" },
  { id: "auth0", label: "Roblox" },
] as const;

export type AuthProvider = typeof AUTH_PROVIDERS[number]["id"];

export type ProviderState = {
  id: AuthProvider;
  label: string;
  linked: boolean;
  identity: UserIdentity | null;
};

export type ProviderStateMap = Record<AuthProvider, ProviderState>;

export function getProviderStateMap(user: User | null): ProviderStateMap {
  return AUTH_PROVIDERS.reduce<ProviderStateMap>((acc, provider) => {
    const identity = findIdentity(user, provider.id);

    acc[provider.id] = {
      id: provider.id,
      label: provider.label,
      linked: Boolean(identity),
      identity,
    };

    return acc;
  }, Object.create(null) as ProviderStateMap);
}

export function getProviderStates(user: User | null): ProviderState[] {
  const map = getProviderStateMap(user);
  return AUTH_PROVIDERS.map(({ id }) => map[id]);
}

export function providerLabel(provider: AuthProvider): string {
  const match = AUTH_PROVIDERS.find((item) => item.id === provider);
  return match?.label ?? provider;
}

export function isFullyLinked(user: User | null): boolean {
  return getProviderStates(user).every((state) => state.linked);
}

export function missingProviders(user: User | null): AuthProvider[] {
  return getProviderStates(user)
    .filter((state) => !state.linked)
    .map((state) => state.id);
}

export function shouldCompleteLinking(session: Session | null): boolean {
  if (!session?.user) {
    return false;
  }

  return !isFullyLinked(session.user);
}

function findIdentity(user: User | null, provider: AuthProvider): UserIdentity | null {
  const identities = user?.identities ?? [];
  return identities.find((identity) => identity.provider === provider) ?? null;
}
