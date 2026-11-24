"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { CloseIcon } from "@/components/store/icons";
import { CartContents } from "@/components/store/cart-contents";
import { getCartSubtotal, useCartStore } from "@/lib/cart-store";
import { formatKes } from "@/lib/store-format";

function subscribeToMount() {
  return () => {};
}

function getClientMountSnapshot() {
  return true;
}

function getServerMountSnapshot() {
  return false;
}

interface CartDrawerProps {
  onClose: () => void;
  open: boolean;
}

export function CartDrawer({ onClose, open }: CartDrawerProps) {
  const isMounted = useSyncExternalStore(
    subscribeToMount,
    getClientMountSnapshot,
    getServerMountSnapshot,
  );
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousPathnameRef = useRef(pathname);
  const items = useCartStore((state) => state.items);
  const subtotal = getCartSubtotal(items);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      if (open) {
        onClose();
      }
    }
  }, [onClose, open, pathname]);

  useEffect(() => {
    if (!open || !isMounted) {
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

      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [isMounted, onClose, open]);

  if (!open || !isMounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close cart drawer"
        className="fixed inset-0 z-[100] cursor-default bg-black/50"
      />
      <div
        ref={dialogRef}
        id="cart-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        tabIndex={-1}
        className="fixed right-0 top-0 z-[101] flex h-dvh w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pb-3 pt-[calc(env(safe-area-inset-top)_+_0.75rem)]">
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
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <CartContents onNavigate={onClose} showSummary={false} />
        </div>
        <footer className="shrink-0 border-t border-border px-5 pb-[calc(env(safe-area-inset-bottom)_+_1rem)] pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold">Subtotal</span>
            <span className="text-lg font-semibold">{formatKes(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Free delivery countrywide.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold hover:bg-surface"
          >
            Continue shopping
          </button>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link
              href="/cart"
              onClick={onClose}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-3 text-center text-sm font-semibold hover:bg-surface"
            >
              View cart
            </Link>
            <Link
              href="/checkout"
              onClick={onClose}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-3 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Checkout
            </Link>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
