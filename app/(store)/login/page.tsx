import type { Metadata } from "next";
import Link from "next/link";

import { signIn } from "@/app/(store)/auth/actions";
import { Container } from "@/components/ui/container";
import { StatusMessage } from "@/components/ui/status-message";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Seniors Enterprises account.",
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[];
    message?: string | string[];
    next?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const next = firstValue(params.next);

  return (
    <main className="py-12 sm:py-20">
      <Container>
        <section className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            Your account
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to view your account and orders.
          </p>
          {firstValue(params.error) === "invalid" ? (
            <StatusMessage tone="danger" boxed className="mt-5">
              Incorrect email or password.
            </StatusMessage>
          ) : null}
          {firstValue(params.message) === "password-updated" ? (
            <StatusMessage tone="info" boxed className="mt-5">
              Your password was updated. Sign in with your new password.
            </StatusMessage>
          ) : null}
          {firstValue(params.error) === "callback" ? (
            <StatusMessage tone="danger" boxed className="mt-5">
              This sign-in link could not be completed. Please try again.
            </StatusMessage>
          ) : null}
          <form action={signIn} className="mt-6 grid gap-4">
            <input type="hidden" name="next" value={next} />
            <label className="grid gap-1.5 text-sm font-medium">
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                className={inputClassName}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                className={inputClassName}
              />
            </label>
            <button type="submit" className={primaryButtonClass}>
              Sign in
            </button>
          </form>
          <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              Forgot password?
            </Link>
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </div>
        </section>
      </Container>
    </main>
  );
}

const inputClassName =
  "min-h-11 rounded-lg border border-border bg-background px-3 text-foreground";
const primaryButtonClass =
  "inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90";
