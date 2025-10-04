import type { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/db/types/supabase";
import { env } from "@/lib/env";

export function createSupabaseMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createMiddlewareClient<Database>({ req, res }, {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
