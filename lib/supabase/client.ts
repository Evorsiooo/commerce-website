"use client";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/db/types/supabase";
import { publicEnv } from "@/lib/env";

const client = createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function getBrowserSupabaseClient() {
  return client;
}
