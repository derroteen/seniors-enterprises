import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const iconAttributes = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export function SearchIcon(props: IconProps) {
  return (
    <svg {...iconAttributes} {...props}>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg {...iconAttributes} {...props}>
      <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.5L21 8H6" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...iconAttributes} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...iconAttributes} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...iconAttributes} {...props}>
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...iconAttributes} {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...iconAttributes} {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function ZoomIcon(props: IconProps) {
  return (
    <svg {...iconAttributes} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5m-10-13v6m-3-3h6" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg {...iconAttributes} {...props}>
      <path d="M20.2 11.8a8.2 8.2 0 0 1-12.1 7.1L4 20l1.2-4A8.2 8.2 0 1 1 20.2 11.8Z" />
      <path d="M9 8.5c.3-.6.7-.5 1-.5l.8 1.8c.1.3 0 .5-.2.7l-.6.7a6.7 6.7 0 0 0 2.8 2.8l.7-.6c.2-.2.4-.3.7-.2l1.8.8c.3.1.3.5.2.9-.2.7-.8 1.3-1.6 1.4-1.2.1-3-.6-4.6-2.1-1.5-1.5-2.3-3.4-2.1-4.6.1-.5.5-.9 1.1-1.1Z" />
    </svg>
  );
}
