import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/types/supabase";
import { env } from "@/lib/env";

let client: SupabaseClient<Database> | null = null;

export function getPublicSupabaseClient(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch,
      },
    });
  }

  return client;
}
