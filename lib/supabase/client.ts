"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/db/types/supabase";
import { publicEnv } from "@/lib/env";

const client = createClientComponentClient<Database>({
  supabaseUrl: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export function getBrowserSupabaseClient() {
  return client;
}
