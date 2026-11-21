import "server-only";

import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ProfileRole = Database["public"]["Enums"]["profile_role"];

async function getAdminIdentity(): Promise<{
  user: User | null;
  role: ProfileRole | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (error.status === 401 || error.name === "AuthSessionMissingError") {
      return { user: null, role: null };
    }
    throw new Error(`Could not verify the current user: ${error.message}`);
  }
  if (!data.user) {
    return { user: null, role: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Could not verify administrator access: ${profileError.message}`);
  }

  return { user: data.user, role: profile?.role ?? null };
}

export async function requireAdminPage() {
  const { user, role } = await getAdminIdentity();
  if (!user) {
    redirect("/admin/login");
  }
  if (role !== "admin") {
    notFound();
  }

  return user;
}

export async function requireAdminAction() {
  const { user, role } = await getAdminIdentity();
  if (!user) {
    throw new Error("Authentication is required.");
  }
  if (role !== "admin") {
    throw new Error("Administrator access is required.");
  }

  return {
    user,
    client: createAdminClient(),
  };
}
