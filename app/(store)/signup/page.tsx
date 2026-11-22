import type { Metadata } from "next";
import Link from "next/link";

import { SignupForm } from "@/components/auth/signup-form";
import { Container } from "@/components/ui/container";
import { StatusIcon } from "@/components/ui/status-message";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a Seniors Enterprises account.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="py-12 sm:py-20">
      <Container>
        <section className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            Your account
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Save your details and keep track of your orders.
          </p>
          {params.message === "check-email" ? (
            <div role="status" className="mt-5 rounded-lg border border-info-border bg-info-bg p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-info">
                <StatusIcon tone="info" />
                Check your email to confirm your account.
              </p>
              <p className="mt-1 text-muted-foreground">
                Follow the link in your inbox to finish signing up.
              </p>
              <Link href="/login" className="mt-3 inline-block font-semibold text-primary hover:underline">
                Return to sign in
              </Link>
            </div>
          ) : (
            <SignupForm hasError={params.error === "invalid"} />
          )}
        </section>
      </Container>
    </main>
  );
}
