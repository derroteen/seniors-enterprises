"use client";

import Link from "next/link";
import { useState } from "react";

import { signUp } from "@/app/(store)/auth/actions";
import { StatusMessage } from "@/components/ui/status-message";

export function SignupForm({ hasError }: { hasError: boolean }) {
  const [showPasswords, setShowPasswords] = useState(false);

  return (
    <form action={signUp} className="mt-6 grid gap-4">
      {hasError ? (
        <StatusMessage tone="danger" boxed>
          We could not create your account. Check your details and try again.
        </StatusMessage>
      ) : null}
      <label className="grid gap-1.5 text-sm font-medium">
        Full name
        <input
          name="fullName"
          autoComplete="name"
          minLength={2}
          maxLength={100}
          required
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Kenyan mobile number
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="0712 345 678"
          required
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Password
        <input
          name="password"
          type={showPasswords ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Confirm password
        <input
          name="confirmPassword"
          type={showPasswords ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClassName}
        />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={showPasswords}
          onChange={(event) => setShowPasswords(event.target.checked)}
          className="size-4 accent-primary"
        />
        Show passwords
      </label>
      <button type="submit" className={primaryButtonClass}>
        Create your account
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

const inputClassName =
  "min-h-11 rounded-lg border border-border bg-background px-3 text-foreground";
const primaryButtonClass =
  "inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90";
