"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Label shown while the request is running. */
  pendingLabel: string;
  /**
   * External pending state for forms that submit via onSubmit/useTransition
   * instead of a form action. When omitted, useFormStatus is used.
   */
  pending?: boolean;
}

export function SubmitButton({
  children,
  className = "",
  disabled,
  pending,
  pendingLabel,
  type = "submit",
  ...props
}: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const isPending = pending ?? formPending;

  return (
    <button
      type={type}
      disabled={disabled || isPending}
      aria-busy={isPending}
      className={`inline-flex items-center gap-2 whitespace-nowrap disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 ${isPending ? "" : "invisible"}`}
      >
        <span className="size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />
      </span>
      <span className="grid">
        <span className={`col-start-1 row-start-1 ${isPending ? "invisible" : ""}`}>
          {children}
        </span>
        <span className={`col-start-1 row-start-1 ${isPending ? "" : "invisible"}`}>
          {pendingLabel}
        </span>
      </span>
    </button>
  );
}
