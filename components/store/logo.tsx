import Image from "next/image";

import { BRAND } from "@/lib/brand";

export type LogoVariant = "full" | "mark";

interface LogoProps {
  className?: string;
  priority?: boolean;
  variant?: LogoVariant;
}

export function Logo({
  className = "",
  priority = false,
  variant = "full",
}: LogoProps) {
  const isFull = variant === "full";
  const width = isFull ? 1600 : 600;
  const height = isFull ? 556 : 669;

  return (
    <span
      className={`relative block shrink-0 ${
        isFull ? "h-11 w-32 sm:w-36" : "size-10"
      } ${className}`}
    >
      <Image
        src={isFull ? "/brand/logo-full-light.png" : "/brand/logo-mark-light.png"}
        alt={BRAND.name}
        width={width}
        height={height}
        priority={priority}
        unoptimized
        sizes={isFull ? "144px" : "40px"}
        className="h-full w-full object-contain object-left dark:hidden"
      />
      <Image
        src={isFull ? "/brand/logo-full-dark.png" : "/brand/logo-mark-dark.png"}
        alt={BRAND.name}
        width={width}
        height={height}
        priority={priority}
        unoptimized
        sizes={isFull ? "144px" : "40px"}
        className="hidden h-full w-full object-contain object-left dark:block"
      />
    </span>
  );
}
