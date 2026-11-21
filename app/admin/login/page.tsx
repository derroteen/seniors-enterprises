import type { Metadata } from "next";

import { loginAdmin } from "@/app/admin/actions";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Admin login | Seniors Enterprises",
  robots: { index: false, follow: false },
};

const loginMessages: Record<string, string> = {
  credentials: "The email or password was not accepted.",
  "not-admin": "This account does not have administrator access.",
  unavailable: "Administrator access could not be verified. Please try again.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="py-16 sm:py-24">
      <Container>
        <section className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            Seniors Enterprises
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Admin login</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with an administrator account to manage the store.
          </p>
          {error && loginMessages[error] ? (
            <p role="alert" className="mt-5 rounded-lg bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200">
              {loginMessages[error]}
            </p>
          ) : null}
          <form action={loginAdmin} className="mt-6 grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium">
              Email
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Sign in
            </button>
          </form>
        </section>
      </Container>
    </main>
  );
}
