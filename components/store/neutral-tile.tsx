import type { ReactNode } from "react";

import { Logo } from "@/components/store/logo";

interface NeutralTileProps {
  className?: string;
  children?: ReactNode;
}

/**
 * Plain surface-colored placeholder used when a catalog item has no photo.
 * Shows the brand mark only — never promotional text.
 */
export function NeutralTile({ className = "", children }: NeutralTileProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 bg-surface p-6 text-center ${className}`}
    >
      <Logo variant="mark" className="opacity-50" />
      {children}
    </div>
  );
}
