import type { HTMLAttributes } from "react";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  surface?: boolean;
}

export function Section({ children, className = "", surface = false, ...props }: SectionProps) {
  return (
    <section
      className={`py-12 sm:py-16 ${surface ? "bg-surface" : ""} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
