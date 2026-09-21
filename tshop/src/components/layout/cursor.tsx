"use client";

import { useEffect, useRef, useState } from "react";
import { useHasFinePointer, usePrefersReducedMotion } from "@/hooks/use-media-query";

/**
 * A 10px ink dot that trails the pointer and swells over interactive
 * elements. The native cursor is never hidden — replacing it is the fastest
 * way to make a site feel broken — so this reads as an accent, not a
 * replacement.
 *
 * Renders nothing on touch devices or when reduced motion is requested.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const fine = useHasFinePointer();
  const reduced = usePrefersReducedMotion();
  const enabled = fine && !reduced;

  useEffect(() => {
    if (!enabled) return;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (!visible) setVisible(true);

      const el = event.target as HTMLElement | null;
      setActive(
        Boolean(el?.closest("a, button, [role='button'], input, summary")),
      );
    };

    const onLeave = () => setVisible(false);

    // Lerp toward the pointer: the lag is what makes it feel weighted.
    const tick = () => {
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
      }
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, [enabled, visible]);

  if (!enabled) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] hidden lg:block"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 300ms" }}
    >
      <div
        className="rounded-full bg-ink transition-[width,height,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: active ? 34 : 10,
          height: active ? 34 : 10,
          opacity: active ? 0.14 : 0.85,
        }}
      />
    </div>
  );
}
