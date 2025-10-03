import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/db/types/supabase";
import { env } from "@/lib/env";
import { shouldCompleteLinking } from "@/lib/auth/providers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("redirect") ?? "/profile";
  let destination = next;

  if (code) {
    const supabase = createRouteHandlerClient<Database>({
      cookies,
    }, {
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    await supabase.auth.exchangeCodeForSession(code);

    const { data, error } = await supabase.auth.getSession();

    if (!error && shouldCompleteLinking(data.session ?? null)) {
      const linkUrl = new URL("/auth/complete", requestUrl.origin);
      linkUrl.searchParams.set("redirect", next);
      destination = `${linkUrl.pathname}${linkUrl.search}`;
    }
  }

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
