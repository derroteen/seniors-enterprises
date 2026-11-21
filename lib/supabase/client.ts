"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to use Supabase.",
    );
  }

  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
