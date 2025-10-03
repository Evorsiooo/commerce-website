"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageShell } from "@/templates/page-shell";
import { Button } from "@/ui/button";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  getProviderStates,
  providerLabel,
  type AuthProvider,
  type ProviderState,
} from "@/lib/auth/providers";
import { extractAuthErrorMessage, isSupabaseUserMissingError } from "@/lib/auth/errors";

const DEFAULT_REDIRECT = "/profile";

export default function CompleteAuthPage() {
  return (
    <Suspense fallback={<CompletionFallback />}>
      <CompletionContent />
    </Suspense>
  );
}

type State = {
  status: "loading" | "ready";
  providers: ProviderState[];
  error: string | null;
  message: string | null;
};

type ActionState = {
  type: "link" | "unlink";
  provider: AuthProvider;
} | null;

function CompletionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);

  const destination = useMemo(() => sanitizeRedirect(searchParams.get("redirect")), [searchParams]);
  const loginRedirect = useMemo(
    () => `/auth/login?redirect=${encodeURIComponent(destination)}`,
    [destination],
  );
  const queryErrorCode = searchParams.get("error");
  const queryErrorProvider = searchParams.get("provider");

  const [state, setState] = useState<State>({
    status: "loading",
    providers: [],
    error: null,
    message: null,
  });
  const [action, setAction] = useState<ActionState>(null);

  const loadState = useCallback(
    async ({ showLoading = true, preserveMessage = false } = {}) => {
      if (showLoading) {
        setState((prev) => ({ ...prev, status: "loading" }));
      }

      const { data, error } = await supabase.auth.getSession();

      if (isSupabaseUserMissingError(error)) {
        await supabase.auth.signOut();
        router.replace(loginRedirect);
        return null;
      }

      if (error) {
        setState({
          status: "ready",
          providers: [],
          error: extractAuthErrorMessage(error),
          message: null,
        });
        return null;
      }

      if (!data.session) {
        router.replace(loginRedirect);
        return null;
      }

      const providers = getProviderStates(data.session.user);

      setState((prev) => ({
        status: "ready",
        providers,
        error: null,
        message: preserveMessage ? prev.message : null,
      }));

      return { providers };
    },
    [loginRedirect, router, supabase],
  );

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    if (!queryErrorCode) {
      return;
    }

    setState((prev) => ({
      ...prev,
      error: mapErrorCode(queryErrorCode, queryErrorProvider),
      message: null,
    }));
  }, [queryErrorCode, queryErrorProvider]);

  useEffect(() => {
    if (state.status !== "ready") {
      return;
    }

    const allLinked = state.providers.every((provider) => provider.linked);
    if (allLinked) {
      router.replace(destination);
    }
  }, [destination, router, state]);

  const handleLink = useCallback(
    async (provider: AuthProvider) => {
      setAction({ type: "link", provider });
      setState((prev) => ({ ...prev, error: null, message: null }));

      try {
        const response = await fetch(`/api/auth/providers/${provider}/link`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ redirect: destination }),
        });

        if (!response.ok) {
          const payload = await safeParse(response);
          setState((prev) => ({
            ...prev,
            status: "ready",
            error: resolveApiErrorMessage(payload?.code, payload?.message, provider),
          }));
          return;
        }

        const payload = (await response.json()) as { redirectUrl?: string };
        if (!payload.redirectUrl) {
          setState((prev) => ({
            ...prev,
            status: "ready",
            error: "Linking response did not include a redirect URL.",
          }));
          return;
        }

        window.location.href = payload.redirectUrl;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: "ready",
          error: extractAuthErrorMessage(error),
        }));
      } finally {
        setAction(null);
      }
    },
    [destination],
  );

  const handleUnlink = useCallback(
    async (provider: AuthProvider) => {
      const target = state.providers.find((item) => item.id === provider);

      if (!target?.linked) {
        setState((prev) => ({
          ...prev,
          error: `${providerLabel(provider)} is not currently linked.`,
          message: null,
        }));
        return;
      }

      const linkedCount = state.providers.filter((item) => item.linked).length;
      if (linkedCount <= 1) {
        setState((prev) => ({
          ...prev,
          error: "At least one provider must remain linked.",
          message: null,
        }));
        return;
      }

      setAction({ type: "unlink", provider });

      try {
        const response = await fetch(`/api/auth/providers/${provider}/unlink`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const payload = await safeParse(response);
          setState((prev) => ({
            ...prev,
            status: "ready",
            error: resolveApiErrorMessage(payload?.code, payload?.message, provider),
          }));
          return;
        }

        const result = await loadState({ showLoading: false, preserveMessage: true });
        if (!result) {
          return;
        }

        setState((prev) => ({
          ...prev,
          error: null,
          message: `${providerLabel(provider)} account disconnected.`,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: "ready",
          error: extractAuthErrorMessage(error),
        }));
      } finally {
        setAction(null);
      }
    },
    [loadState, state.providers],
  );

  const linkingProvider = action?.type === "link" ? action.provider : null;
  const unlinkingProvider = action?.type === "unlink" ? action.provider : null;

  return (
    <PageShell className="flex flex-1 items-center justify-center" background="muted">
      <section className="w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <header className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-neutral-500">Link providers</span>
          <h1 className="text-2xl font-semibold">Connect both Discord and Roblox</h1>
          <p className="text-sm text-neutral-600">
            We need both accounts to verify ownership and keep business records in sync. Link any missing provider below.
          </p>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {state.providers.map((provider) => {
            const isLinking = linkingProvider === provider.id;
            const isUnlinking = unlinkingProvider === provider.id;

            return (
              <article
                key={provider.id}
                className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-semibold">{provider.label}</h2>
                  <p className="text-xs text-neutral-600">
                    {provider.linked ? "Linked" : "Not linked"}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="flex-1"
                    disabled={provider.linked || isLinking || state.status === "loading"}
                    onClick={() => handleLink(provider.id)}
                  >
                    {provider.linked ? "Linked" : isLinking ? "Opening…" : `Link ${provider.label}`}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={!provider.linked || isUnlinking || state.status === "loading"}
                    onClick={() => handleUnlink(provider.id)}
                  >
                    {isUnlinking ? "Disconnecting…" : "Unlink"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>

        {state.error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        {state.message ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {state.message}
          </div>
        ) : null}

        <footer className="mt-6 text-xs text-neutral-500">
          Need help? Contact the Commerce Office staff or verify that the Roblox integration in Auth0 is enabled for your tenant.
        </footer>
      </section>
    </PageShell>
  );
}

function CompletionFallback() {
  return (
    <PageShell className="flex flex-1 items-center justify-center" background="muted">
      <section className="w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="h-6 w-48 animate-pulse rounded bg-neutral-200" />
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((item) => (
              <div key={item} className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
                <div className="h-10 w-full animate-pulse rounded bg-neutral-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function sanitizeRedirect(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return DEFAULT_REDIRECT;
  }

  return value;
}

async function safeParse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function resolveApiErrorMessage(code: string | undefined, fallback: string | undefined, provider: AuthProvider) {
  if (code === "identity_conflict" || code === "auth0_identity_conflict") {
    return `${providerLabel(provider)} account is already linked to another portal profile.`;
  }

  if (code === "link_failed" || code === "auth0_link_failed") {
    return fallback ?? `We couldn’t link your ${providerLabel(provider)} account. Please try again.`;
  }

  return fallback ?? "Something went wrong. Please try again.";
}

function mapErrorCode(code: string, providerParam: string | null) {
  switch (code) {
    case "auth0_identity_conflict":
      return "That Roblox account is already linked to another portal profile. Try a different Roblox account or contact support.";
    case "auth0_link_failed":
      return "We couldn’t complete the Roblox linking flow. Please try again.";
    case "auth0_missing_user":
      return "Your login session expired during the Roblox flow. Sign in again to continue.";
    case "identity_conflict":
      return `${providerLabel(normalizeProviderParam(providerParam))} account is already linked to another profile.`;
    default:
      return "Something went wrong while linking accounts. Please try again.";
  }
}

function normalizeProviderParam(providerParam: string | null): AuthProvider {
  return providerParam === "auth0" ? "auth0" : "discord";
}