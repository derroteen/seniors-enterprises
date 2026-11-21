import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

let catalogClient: ReturnType<typeof createSupabaseClient<Database>> | undefined;

function missingConfigurationMessage(missingVariables: string[]) {
  if (process.env.NODE_ENV === "development" && missingVariables.length > 0) {
    return `Supabase configuration is missing ${missingVariables.join(" and ")}. Add the missing variable(s) to .env.local.`;
  }
  return "Supabase is unavailable.";
}

function getPublicSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missingVariables = [
    ...(supabaseUrl ? [] : ["NEXT_PUBLIC_SUPABASE_URL"]),
    ...(supabaseAnonKey ? [] : ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]),
  ];

  if (!isSupabaseConfigured() || !supabaseUrl || !supabaseAnonKey) {
    throw new Error(missingConfigurationMessage(missingVariables));
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function createCatalogClient() {
  if (catalogClient) {
    return catalogClient;
  }

  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseConfig();
  catalogClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      fetch: (input, init) => {
        if (process.env.NODE_ENV === "development") {
          return fetch(input, { ...init, cache: "no-store" });
        }
        return fetch(input, { ...init, next: { revalidate: 60 } });
      },
    },
  });

  return catalogClient;
}

export async function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseConfig();

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes(
              "Cookies can only be modified in a Server Action or Route Handler",
            )
          ) {
            console.warn(
              "Supabase refreshed cookies could not be saved during Server Component rendering.",
            );
            return;
          }
          throw error;
        }
      },
    },
  });
}
