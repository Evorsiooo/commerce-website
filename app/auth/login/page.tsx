"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/ui/button";

const providers = [
  { id: "discord" as const, label: "Sign in with Discord" },
  { id: "roblox" as const, label: "Sign in with Roblox" },
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
  const errorCode = searchParams.get("error");
  const router = useRouter();
  const [loading, setLoading] = useState<ProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resolvedError = mapAuthErrorCode(errorCode);

  useEffect(() => {
    if (resolvedError) {
      setError(resolvedError);
    }
  }, [resolvedError]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (!response.ok) {
          console.error("Failed to load auth session", response.status, response.statusText);
          return;
        }

        const payload: { authenticated: boolean } = await response.json();

        if (!cancelled && payload.authenticated) {
          router.replace(destination);
        }
      } catch (cause) {
        console.error("Failed to load auth session", cause);
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [destination, router]);

  const handleSignIn = useCallback(
    async (provider: ProviderId) => {
      setError(null);
      setLoading(provider);
      const startUrl = new URL("/api/auth/auth0/start", window.location.origin);
      startUrl.searchParams.set("redirect", destination);
      startUrl.searchParams.set("provider", provider);
      window.location.href = startUrl.toString();
    },
    [destination],
  );

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold">Access the Commerce Portal</h1>
        <p className="text-sm text-neutral-600">
          Choose Discord or Roblox to access the Commerce Portal. You can add additional providers later when linking is available.
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
        You&apos;ll be redirected back here after authentication. Make sure pop-up or redirect blockers are disabled while signing in.
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

function mapAuthErrorCode(code: string | null): string | null {
  if (!code) {
    return null;
  }

  switch (code) {
    case "auth0_not_configured":
      return "Roblox authentication is temporarily unavailable. Please contact support.";
    case "auth0_session_expired":
      return "Your sign-in session expired. Please try again.";
    case "auth0_state_mismatch":
      return "We couldn't verify your Roblox login. Please start the sign-in process again.";
    case "auth0_token_exchange_failed":
    case "auth0_token_missing":
      return "Roblox sign-in failed while exchanging credentials. Please retry in a moment.";
    case "auth0_sign_in_failed":
      return "We couldn't complete your Roblox session. Please ensure the account isn't already linked.";
    case "auth0_missing_params":
      return "The Roblox login response was incomplete. Please try again.";
    case "auth0_invalid_token":
      return "We couldn't validate the Roblox login response. Please start the sign-in process again.";
    default:
      return null;
  }
}
