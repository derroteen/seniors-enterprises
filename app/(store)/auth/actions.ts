"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { kenyanPhoneSchema } from "@/lib/checkout/schema";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(256),
});

const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    phone: kenyanPhoneSchema,
    email: z.email(),
    password: z.string().min(8).max(256),
    confirmPassword: z.string().min(8).max(256),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

function getSafeNextPath(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /^[a-z][a-z\d+.-]*:/i.test(value)
  ) {
    return null;
  }

  let destination: URL;
  try {
    destination = new URL(value, "https://seniors-enterprises.invalid");
  } catch {
    return null;
  }
  if (destination.origin !== "https://seniors-enterprises.invalid") {
    return null;
  }
  if (destination.pathname === "/admin" || destination.pathname.startsWith("/admin/")) {
    return null;
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}

function getLoginErrorPath(next: string | null) {
  const query = new URLSearchParams({ error: "invalid" });
  if (next) {
    query.set("next", next);
  }
  return `/login?${query.toString()}`;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = formData.get("next");
  const nextValue = typeof next === "string" ? next : null;
  const destination = getSafeNextPath(nextValue);
  const parsed = credentialsSchema.safeParse({ email, password });

  if (!parsed.success) {
    redirect(getLoginErrorPath(nextValue));
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
  if (signInError) {
    redirect(getLoginErrorPath(nextValue));
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    await supabase.auth.signOut();
    redirect(getLoginErrorPath(nextValue));
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError) {
    await supabase.auth.signOut();
    redirect(getLoginErrorPath(nextValue));
  }

  if (profile?.role === "admin") {
    redirect("/admin");
  }
  redirect(destination ?? "/account");
}

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    redirect("/signup?error=invalid");
  }

  const supabase = await createClient();
  // Add Cloudflare Turnstile verification here before launch.
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: new URL("/auth/callback", getSiteUrl()).toString(),
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
      },
    },
  });

  if (error) {
    console.error("Account sign-up failed.", error);
    redirect("/signup?error=invalid");
  }
  if (!data.session) {
    redirect("/signup?message=check-email");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    await supabase.auth.signOut();
    redirect("/signup?error=invalid");
  }

  redirect("/account");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = z.email().safeParse(email);
  if (!parsed.success) {
    redirect("/forgot-password?error=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: new URL("/reset-password", getSiteUrl()).toString(),
  });
  if (error) {
    console.error("Password reset request failed.", error);
    redirect("/forgot-password?error=send");
  }

  redirect("/forgot-password?message=sent");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const parsed = z
    .object({
      password: z.string().min(8).max(256),
      confirmPassword: z.string().min(8).max(256),
    })
    .refine((value) => value.password === value.confirmPassword)
    .safeParse({ password, confirmPassword });

  if (!parsed.success) {
    redirect("/reset-password?error=invalid");
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    redirect("/reset-password?error=expired");
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    console.error("Password update failed.", error);
    redirect("/reset-password?error=update");
  }

  revalidatePath("/", "layout");
  redirect("/account");
}

export async function signOut() {
  const supabase = await createClient();
  const { error: userError } = await supabase.auth.getUser();
  if (userError && userError.status !== 401 && userError.name !== "AuthSessionMissingError") {
    throw new Error(`Could not verify the current user before sign-out: ${userError.message}`);
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Could not sign out: ${error.message}`);
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
