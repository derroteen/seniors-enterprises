import type { Metadata } from "next";
import Link from "next/link";

import { requestPasswordReset } from "@/app/(store)/auth/actions";
import { Container } from "@/components/ui/container";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusMessage } from "@/components/ui/status-message";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your account.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="py-12 sm:py-20">
      <Container>
        <section className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            Account help
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Forgot password?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we will send a password reset link if an account matches.
          </p>
          {params.message === "sent" ? (
            <StatusMessage tone="info" boxed className="mt-5">
              If an account exists for this email, we sent a password reset link.
            </StatusMessage>
          ) : null}
          {params.error === "invalid" ? (
            <StatusMessage tone="danger" boxed className="mt-5">
              Enter a valid email address.
            </StatusMessage>
          ) : null}
          {params.error === "send" ? (
            <StatusMessage tone="danger" boxed className="mt-5">
              We could not send the reset email. Please try again.
            </StatusMessage>
          ) : null}
          <form action={requestPasswordReset} className="mt-6 grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium">
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
              />
            </label>
            <SubmitButton
              pendingLabel="Send reset link"
              className="min-h-12 justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Send reset link
            </SubmitButton>
          </form>
          <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </section>
      </Container>
    </main>
  );
}
