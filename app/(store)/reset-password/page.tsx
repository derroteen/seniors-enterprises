import type { Metadata } from "next";

import { updatePassword } from "@/app/(store)/auth/actions";
import { Container } from "@/components/ui/container";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[]; error?: string }>;
}) {
  const params = await searchParams;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=%2Freset-password`);
  }

  return (
    <main className="py-12 sm:py-20">
      <Container>
        <section className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            Account help
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Choose a new password</h1>
          {params.error === "expired" ? (
            <p role="alert" className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200">
              This reset link has expired. Request a new one and try again.
            </p>
          ) : null}
          {params.error === "update" ? (
            <p role="alert" className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200">
              We could not update your password. Request a new reset link and try again.
            </p>
          ) : null}
          {params.error === "invalid" ? (
            <p role="alert" className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200">
              Use a password with at least 8 characters and make sure both entries match.
            </p>
          ) : null}
          <form action={updatePassword} className="mt-6 grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium">
              New password
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={8}
                required
                className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Confirm new password
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                minLength={8}
                required
                className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Update password
            </button>
          </form>
        </section>
      </Container>
    </main>
  );
}
