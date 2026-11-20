"use client";

import { useEffect, useRef } from "react";

import { CloseIcon } from "@/components/store/icons";
import { CartContents } from "@/components/store/cart-contents";

interface CartDrawerProps {
  onClose: () => void;
  open: boolean;
}

export function CartDrawer({ onClose, open }: CartDrawerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close cart drawer"
        className="absolute inset-0 cursor-default bg-black/50"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
      >
        <div className="flex min-h-16 items-center justify-between border-b border-border px-5">
          <h2 id="cart-drawer-title" className="font-display text-xl font-semibold">
            Your cart
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="grid size-11 place-items-center rounded-lg hover:bg-surface"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <CartContents onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
