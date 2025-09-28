"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/ui/button";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

const providers = [
  { id: "discord" as const, label: "Sign in with Discord" },
  { id: "auth0" as const, label: "Sign in with Roblox (Auth0)" },
];

type ProviderId = (typeof providers)[number]["id"];

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const destination = searchParams.get("redirect") ?? "/profile";
  const [loading, setLoading] = useState<ProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(
    async (provider: ProviderId) => {
      setError(null);
      setLoading(provider);
      const supabase = getBrowserSupabaseClient();

      const url = new URL(window.location.origin + "/auth/callback");
      url.searchParams.set("redirect", destination);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as "discord",
        options: {
          redirectTo: url.toString(),
          scopes: provider === "discord" ? "identify email guilds" : undefined,
        },
      });

      if (error) {
        console.error(error);
        setError(error.message);
        setLoading(null);
      }
    },
    [destination],
  );

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold">Access the Commerce Portal</h1>
        <p className="text-sm text-neutral-600">
          Login with both Discord and Roblox to unlock business owner and staff features.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            onClick={() => handleSignIn(provider.id)}
            disabled={loading !== null}
            className="w-full"
          >
            {loading === provider.id ? "Redirecting…" : provider.label}
          </Button>
        ))}
      </div>

      <p className="rounded-lg bg-neutral-50 p-4 text-xs text-neutral-600">
        You&apos;ll be redirected back here after authentication. If Roblox linking fails, confirm the Auth0 connection name matches the Supabase provider ID <code>auth0</code>.
      </p>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function LoginPageFallback() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="h-6 w-3/4 animate-pulse rounded bg-neutral-200" />
      <div className="space-y-2">
        <div className="h-10 w-full animate-pulse rounded bg-neutral-200" />
        <div className="h-10 w-full animate-pulse rounded bg-neutral-200" />
      </div>
      <div className="h-16 w-full animate-pulse rounded bg-neutral-100" />
    </section>
  );
}
