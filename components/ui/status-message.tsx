import type { HTMLAttributes, ReactNode } from "react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "muted";

interface StatusMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  tone: StatusTone;
  boxed?: boolean;
}

const toneClasses: Record<StatusTone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  muted: "text-muted-foreground",
};

const boxClasses: Record<StatusTone, string> = {
  success: "border-success-border bg-success-bg",
  warning: "border-warning-border bg-warning-bg",
  danger: "border-danger-border bg-danger-bg",
  info: "border-info-border bg-info-bg",
  muted: "border-muted-border bg-muted-bg",
};

const statusTones: Record<string, StatusTone> = {
  paid: "success",
  delivered: "success",
  success: "success",
  pending: "warning",
  unpaid: "warning",
  processing: "info",
  shipped: "info",
  cancelled: "danger",
  failed: "danger",
  refunded: "danger",
};

export function StatusIcon({
  className = "size-4",
  tone,
}: {
  className?: string;
  tone: StatusTone;
}) {
  return (
    <svg
      aria-hidden="true"
      className={`mt-0.5 shrink-0 ${className}`}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {tone === "success" ? (
        <>
          <circle cx="10" cy="10" r="7.5" />
          <path d="m6.5 10 2.2 2.2 4.8-4.8" />
        </>
      ) : tone === "warning" ? (
        <>
          <path d="M8.8 3.5a1.4 1.4 0 0 1 2.4 0l6.1 10.7a1.4 1.4 0 0 1-1.2 2.1H4a1.4 1.4 0 0 1-1.2-2.1L8.8 3.5Z" />
          <path d="M10 7v3.8m0 2.3h.01" />
        </>
      ) : tone === "danger" ? (
        <>
          <circle cx="10" cy="10" r="7.5" />
          <path d="M10 6.5v4m0 2.8h.01" />
        </>
      ) : (
        <>
          <circle cx="10" cy="10" r="7.5" />
          <path d="M10 9v4m0-6h.01" />
        </>
      )}
    </svg>
  );
}

export function StatusMessage({
  boxed = false,
  children,
  className = "",
  role,
  tone,
  ...props
}: StatusMessageProps) {
  return (
    <p
      role={role ?? (tone === "danger" ? "alert" : "status")}
      className={`flex min-w-0 items-start gap-2 text-sm ${toneClasses[tone]} ${
        boxed ? `rounded-lg border p-3 ${boxClasses[tone]}` : ""
      } ${className}`}
      {...props}
    >
      <StatusIcon tone={tone} />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

export function StatusBadge({
  className = "",
  status,
}: {
  className?: string;
  status: string;
}) {
  const normalizedStatus = status.toLowerCase();
  const tone = statusTones[normalizedStatus] ?? "muted";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium capitalize ${
        toneClasses[tone]
      } ${boxClasses[tone]} ${className}`}
    >
      <StatusIcon className="size-3.5" tone={tone} />
      {status}
    </span>
  );
}
