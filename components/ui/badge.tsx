import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "primary" | "gold" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface text-foreground",
  primary: "bg-primary text-primary-foreground",
  gold: "bg-accent text-accent-foreground",
  outline: "border border-border text-foreground",
};

export function Badge({ children, className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
