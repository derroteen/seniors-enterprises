"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const currentTheme = mounted ? theme ?? "system" : "system";
  const nextTheme = currentTheme === "light" ? "dark" : currentTheme === "dark" ? "system" : "light";
  const iconTheme = mounted ? resolvedTheme ?? "light" : "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Current theme: ${currentTheme}. Switch to ${nextTheme} theme.`}
      title={`Theme: ${currentTheme} (click for ${nextTheme})`}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-background"
    >
      {iconTheme === "dark" ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
          <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
      <span className="capitalize">{currentTheme}</span>
    </button>
  );
}
