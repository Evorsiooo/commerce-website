"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/ui/button";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { providerLabel, resolveLinkedProviders } from "@/lib/auth/linking";

const REQUIRED_PROVIDERS = ["discord", "auth0"] as const;

type ProviderId = typeof REQUIRED_PROVIDERS[number];

type LinkState = Record<ProviderId, boolean>;

type Status = "loading" | "ready" | "linked";

type FetchState = {
  status: Status;
  providers: LinkState;
  error: string | null;
};

const initialState: FetchState = {
  status: "loading",
  providers: {
    discord: false,
    auth0: false,
  },
  error: null,
};

export default function LinkAccountsPage() {
  return (
    <Suspense fallback={<LinkAccountsFallback />}>
      <LinkAccountsContent />
    </Suspense>
  );
}

function LinkAccountsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);
  const [state, setState] = useState(initialState);
  const [linking, setLinking] = useState<ProviderId | null>(null);
  const redirectTarget = searchParams.get("redirect") ?? "/profile";

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        setState((current) => ({ ...current, status: "ready", error: error.message }));
        return;
      }

      if (!data.session) {
        router.replace(`/auth/login?redirect=${encodeURIComponent("/auth/link-accounts")}`);
        return;
      }

      const providers = resolveLinkedProviders(data.session.user);
      const allLinked = REQUIRED_PROVIDERS.every((provider) => providers[provider]);

      setState({ status: allLinked ? "linked" : "ready", providers, error: null });

      if (allLinked) {
        router.replace("/profile");
      }
    });
  }, [router, supabase]);

  const handleLink = async (provider: ProviderId) => {
    setLinking(provider);

    if (provider === "auth0") {
      const startUrl = new URL("/api/auth/auth0/start", window.location.origin);
      startUrl.searchParams.set("redirect", redirectTarget);
      startUrl.searchParams.set("intent", "link");
      window.location.href = startUrl.toString();
      return;
    }

    const url = new URL(window.location.origin + "/auth/callback");
    url.searchParams.set("redirect", "/auth/link-accounts");

    const { error } = await supabase.auth.linkIdentity({
      provider: provider as "discord",
      options: {
        redirectTo: url.toString(),
      },
    });

    if (error) {
      console.error(error);
      setState((current) => ({ ...current, error: error.message }));
      setLinking(null);
      return;
    }

    const { data } = await supabase.auth.getSession();
    const providers = resolveLinkedProviders(data.session?.user ?? null);
    const allLinked = REQUIRED_PROVIDERS.every((item) => providers[item]);

    setState({ status: allLinked ? "linked" : "ready", providers, error: null });

    if (allLinked) {
      router.replace("/profile");
    } else {
      setLinking(null);
    }
  };

  const unlinkedProviders = REQUIRED_PROVIDERS.filter((provider) => !state.providers[provider]);

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Link your accounts</h1>
        <p className="text-sm text-neutral-600">
          Discord and Roblox identities are required to continue. Finish linking both providers below.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {REQUIRED_PROVIDERS.map((provider) => {
          const linked = state.providers[provider];
          return (
            <article
              key={provider}
              className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4"
            >
              <div>
                <h2 className="text-base font-semibold">{providerLabel(provider)}</h2>
                <p className="text-xs text-neutral-600">
                  {linked ? "Linked" : "Not linked"}
                </p>
              </div>
              <Button
                variant={linked ? "outline" : "default"}
                disabled={linked || linking !== null}
                onClick={() => handleLink(provider)}
              >
                {linked ? "Linked" : linking === provider ? "Opening…" : `Link ${providerLabel(provider)}`}
              </Button>
            </article>
          );
        })}
      </div>

      {state.status === "ready" && unlinkedProviders.length > 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          Unlinked providers: {unlinkedProviders.map(providerLabel).join(", ")}.
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <p className="text-xs text-neutral-500">
        Having trouble? Verify the Roblox OAuth provider in Supabase is enabled and that callback URLs in the portal match your deployment.
      </p>
    </section>
  );
}

function LinkAccountsFallback() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Link your accounts</h1>
        <p className="text-sm text-neutral-600">Preparing account status…</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {REQUIRED_PROVIDERS.map((provider) => (
          <article
            key={provider}
            className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4"
          >
            <div>
              <h2 className="text-base font-semibold">{providerLabel(provider)}</h2>
              <p className="text-xs text-neutral-600">Checking link status…</p>
            </div>
            <Button variant="outline" disabled>
              Loading…
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
