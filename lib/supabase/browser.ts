"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder"
  );
}
