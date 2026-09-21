"use client";

import { usePathname } from "next/navigation";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";

/**
 * A short fade-and-rise on every route change.
 *
 * Keyed on the pathname so React remounts the subtree, restarting the CSS
 * animation. Deliberately brief (520ms) and opacity/transform only: a
 * transition the visitor has to wait through is a cost, not a feature.
 *
 * The fill mode is `backwards`, not `both`, and that is load-bearing: with
 * `both` this wrapper keeps an identity `transform` matrix forever, which
 * makes it the containing block for every `position: fixed` element on the
 * page beneath it — they scroll away with the content instead of sticking
 * to the viewport.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <div
      key={pathname}
      style={{ animation: "tsFadeUp 520ms cubic-bezier(0.16, 1, 0.3, 1) backwards" }}
    >
      {children}
    </div>
  );
}
