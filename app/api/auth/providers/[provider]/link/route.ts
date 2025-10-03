import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/db/types/supabase";
import { env } from "@/lib/env";
import { AUTH_PROVIDERS, getProviderStateMap, type AuthProvider } from "@/lib/auth/providers";
import { extractAuthErrorMessage } from "@/lib/auth/errors";

const DISCORD_SCOPES = "identify";

type RouteSupabaseClient = ReturnType<typeof createRouteHandlerClient<Database>>;

type LinkPayload = {
  redirect?: string;
};

export async function POST(request: Request, { params }: { params: { provider: string } }) {
  const provider = normalizeProvider(params.provider);

  if (!provider) {
    return NextResponse.json({ message: "Unknown provider" }, { status: 400 });
  }

  const supabase = createRouteHandlerClient<Database>({ cookies }, {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  const [{ data, error }, payload] = await Promise.all([
    supabase.auth.getSession(),
    parsePayload(request),
  ] as const);

  if (error) {
    console.error("Failed to load session before linking", error);
    return NextResponse.json({ message: extractAuthErrorMessage(error) }, { status: 500 });
  }

  if (!data.session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const redirect = sanitizeRedirect(payload.redirect);
  const providerStates = getProviderStateMap(data.session.user);

  if (providerStates[provider].linked) {
    return NextResponse.json({ message: `${providerStates[provider].label} is already linked.` }, { status: 409 });
  }

  if (provider === "discord") {
    return handleDiscordLink(request, supabase, redirect);
  }

  if (provider === "auth0") {
    return handleRobloxLink(request, redirect);
  }

  return NextResponse.json({ message: "Unsupported provider" }, { status: 400 });
}

async function handleDiscordLink(request: Request, supabase: RouteSupabaseClient, redirect: string) {
  const requestUrl = new URL(request.url);
  const callbackUrl = new URL("/auth/callback", requestUrl.origin);
  callbackUrl.searchParams.set("intent", "link");
  callbackUrl.searchParams.set("redirect", redirect);

  const { data, error } = await supabase.auth.linkIdentity({
    provider: "discord",
    options: {
      redirectTo: callbackUrl.toString(),
      scopes: DISCORD_SCOPES,
      queryParams: {
        scope: DISCORD_SCOPES,
      },
      skipBrowserRedirect: true,
    },
  } as never);

  if (error) {
    console.error("Discord linking failed", error);
    const status = error.status ?? 500;
    return NextResponse.json({
      message: extractAuthErrorMessage(error),
      code: mapLinkErrorCode(error.message),
    }, { status });
  }

  if (!data?.url) {
    return NextResponse.json({ message: "Discord linking did not return a redirect URL" }, { status: 500 });
  }

  return NextResponse.json({ redirectUrl: data.url });
}

async function handleRobloxLink(request: Request, redirect: string) {
  const requestUrl = new URL(request.url);
  const startUrl = new URL("/api/auth/auth0/start", requestUrl.origin);
  startUrl.searchParams.set("intent", "link");

  if (redirect) {
    startUrl.searchParams.set("redirect", redirect);
  }

  return NextResponse.json({ redirectUrl: startUrl.toString() });
}

function normalizeProvider(input: string): AuthProvider | null {
  const match = AUTH_PROVIDERS.find((provider) => provider.id === input);
  return match?.id ?? null;
}

async function parsePayload(request: Request): Promise<LinkPayload> {
  try {
    const json = await request.json();
    return {
      redirect: typeof json?.redirect === "string" ? json.redirect : undefined,
    };
  } catch {
    return {};
  }
}

function sanitizeRedirect(input: string | undefined) {
  if (!input || !input.startsWith("/")) {
    return "/profile";
  }

  return input;
}

function mapLinkErrorCode(message: string | undefined) {
  if (!message) {
    return "link_failed";
  }

  if (message.toLowerCase().includes("already in use")) {
    return "identity_conflict";
  }

  return "link_failed";
}
