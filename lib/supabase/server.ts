import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/types/supabase";
import { env } from "@/lib/env";

let client: SupabaseClient<Database> | null = null;

export function createServerSupabaseClient() {
  if (!client) {
    const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    client = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return client;
}
