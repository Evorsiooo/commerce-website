"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { type ReactNode, useMemo } from "react";

import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export function Providers({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);

  return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
}
