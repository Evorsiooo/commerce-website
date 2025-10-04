import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/db/types/supabase";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("redirect") ?? "/profile";
  if (code) {
    const supabase = createRouteHandlerClient<Database>({
      cookies,
    }, {
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
