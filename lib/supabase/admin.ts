import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missingVariables = [
    ...(supabaseUrl ? [] : ["NEXT_PUBLIC_SUPABASE_URL"]),
    ...(supabaseAnonKey ? [] : ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]),
    ...(serviceRoleKey ? [] : ["SUPABASE_SERVICE_ROLE_KEY"]),
  ];
  if (!isSupabaseConfigured() || !supabaseUrl || !serviceRoleKey) {
    const message =
      process.env.NODE_ENV === "development" && missingVariables.length > 0
        ? `Supabase configuration is missing ${missingVariables.join(" and ")}. Add the missing variable(s) to .env.local.`
        : "Supabase is unavailable.";
    throw new Error(message);
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
