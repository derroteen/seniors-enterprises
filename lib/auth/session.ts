import "server-only";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function isMissingSession(error: { name: string; status?: number }) {
  return error.name === "AuthSessionMissingError" || error.status === 401;
}

export async function getCurrentAuthContext() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (isMissingSession(error)) {
      return null;
    }
    throw new Error(`Could not verify the current user: ${error.message}`);
  }
  if (!data.user) {
    return null;
  }

  return { supabase, user: data.user };
}

export async function requireCurrentUser(nextPath = "/account") {
  const context = await getCurrentAuthContext();
  if (!context) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return context;
}

export async function getCurrentUserId() {
  const context = await getCurrentAuthContext();
  return context?.user.id ?? null;
}

export async function getCheckoutProfile() {
  const context = await getCurrentAuthContext();
  if (!context) {
    return null;
  }

  const { data: profile, error } = await context.supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", context.user.id)
    .maybeSingle();
  if (error) {
    throw new Error(`Could not load checkout profile: ${error.message}`);
  }

  return {
    fullName: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    email: context.user.email ?? "",
  };
}

export async function getHeaderAuthState() {
  try {
    const context = await getCurrentAuthContext();
    if (!context) {
      return { isSignedIn: false, isAdmin: false };
    }

    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select("role")
      .eq("id", context.user.id)
      .maybeSingle();
    if (error) {
      console.error("Could not verify the header account role.", error);
      return { isSignedIn: true, isAdmin: false };
    }

    return { isSignedIn: true, isAdmin: profile?.role === "admin" };
  } catch (error) {
    console.error("Could not verify the header sign-in state.", error);
    return { isSignedIn: false, isAdmin: false };
  }
}
