import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/db/types/supabase";
import { env } from "@/lib/env";
import {
  AUTH_PROVIDERS,
  getProviderStateMap,
  shouldCompleteLinking,
  type AuthProvider,
} from "@/lib/auth/providers";
import { extractAuthErrorMessage } from "@/lib/auth/errors";

const MIN_LINKED_PROVIDERS = 1;

type RouteContext = {
  params: {
    provider: string;
  };
};

type UnlinkResponse = ReturnType<typeof getProviderStateMap>;

export async function DELETE(request: Request, context: RouteContext) {
  const provider = normalizeProvider(context.params.provider);

  if (!provider) {
    return NextResponse.json({ message: "Unknown provider" }, { status: 400 });
  }

  const supabase = createRouteHandlerClient<Database>({ cookies }, {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Failed to load session before unlinking", error);
    return NextResponse.json({ message: extractAuthErrorMessage(error) }, { status: 500 });
  }

  if (!data.session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const providerStates = getProviderStateMap(data.session.user);
  const target = providerStates[provider];

  if (!target.linked || !target.identity) {
    return NextResponse.json({ message: `${target.label} is not linked.` }, { status: 409 });
  }

  const linkedProviders = Object.values(providerStates).filter((state) => state.linked);

  if (linkedProviders.length <= MIN_LINKED_PROVIDERS) {
    return NextResponse.json({ message: "At least one provider must remain linked." }, { status: 400 });
  }

  const { error: unlinkError } = await supabase.auth.unlinkIdentity(target.identity);

  if (unlinkError) {
    console.error("Failed to unlink provider", unlinkError);
    const status = unlinkError.status ?? 500;
    return NextResponse.json({ message: extractAuthErrorMessage(unlinkError) }, { status });
  }

  const refreshed = await supabase.auth.getSession();
  const responseBody: { providers: UnlinkResponse; requireLinking: boolean } = {
    providers: getProviderStateMap(refreshed.data.session?.user ?? null),
    requireLinking: shouldCompleteLinking(refreshed.data.session ?? null),
  };

  return NextResponse.json(responseBody);
}

function normalizeProvider(input: string): AuthProvider | null {
  const match = AUTH_PROVIDERS.find((provider) => provider.id === input);
  return match?.id ?? null;
}
