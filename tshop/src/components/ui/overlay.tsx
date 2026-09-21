"use client";

import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type Props = {
  open: boolean;
  onClose: () => void;
  /** `side` slides in from the right; `sheet` drops from the top. */
  variant?: "side" | "sheet";
  title: string;
  /** Hide the title visually but keep it for screen readers. */
  hideTitle?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared shell for the cart drawer, the search overlay and the mobile menu.
 *
 * Handles the things that are easy to skip and immediately obvious when
 * missing: Escape to dismiss, a focus trap, focus restored to whatever
 * opened it, background scroll locked, and `inert`-equivalent semantics via
 * `aria-modal`.
 */
export function Overlay({
  open,
  onClose,
  variant = "side",
  title,
  hideTitle = false,
  children,
  footer,
  className,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useScrollLock(open);

  // Remember the trigger so focus can go home on close.
  useEffect(() => {
    if (open) {
      restoreRef.current = document.activeElement as HTMLElement | null;
    } else {
      restoreRef.current?.focus?.();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Move focus into the panel on the next frame, after it is laid out.
    const raf = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70]",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      {/* Scrim — a wash rather than a blackout, so the page stays present. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fechar"
        onClick={onClose}
        className={cn(
          "absolute inset-0 w-full cursor-default bg-ink/25 backdrop-blur-[2px]",
          "transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal={open}
        aria-label={title}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          "absolute bg-canvas shadow-large outline-none",
          "transition-transform duration-[550ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          "flex flex-col",
          variant === "side"
            ? [
                "right-0 top-0 h-full w-full max-w-[26rem]",
                open ? "translate-x-0" : "translate-x-full",
              ]
            : [
                "left-0 top-0 w-full max-h-[100dvh]",
                open ? "translate-y-0" : "-translate-y-full",
              ],
          className,
        )}
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
          <h2
            className={cn(
              "text-h3",
              hideTitle && "sr-only",
            )}
          >
            {title}
          </h2>
          <Button
            variant="icon"
            size="sm"
            onClick={onClose}
            aria-label="Fechar"
            className={cn(hideTitle && "ml-auto")}
          >
            <X className="size-5" aria-hidden />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {footer && (
          <div className="border-t border-line bg-elevated px-6 py-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
