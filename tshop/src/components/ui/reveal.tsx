"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  /** Stagger, in milliseconds, applied on top of the shared curve. */
  delay?: number;
  /** How far the element travels in. Keep it small; 40px is already a lot. */
  distance?: number;
  /** Fraction of the element that must be visible before it plays. */
  threshold?: number;
  as?: "div" | "section" | "li" | "article" | "span";
  className?: string;
};

/**
 * Plays a single fade-and-rise the first time an element enters the
 * viewport, then disconnects. One observer per element, `transform` and
 * `opacity` only — nothing here can trigger layout.
 *
 * Under reduced motion the element is simply shown: `shown` is derived, not
 * set from an effect, so there is no render where the content is hidden.
 * Content is only ever offset, never removed, so a visitor without
 * JavaScript sees a finished page rather than an empty one.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 28,
  threshold = 0.15,
  as: Tag = "div",
  className,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [entered, setEntered] = useState(false);
  const reduced = usePrefersReducedMotion();
  const shown = entered || reduced;

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;

    // Fires asynchronously on first observation, so an element already past
    // the fold (deep link, restored scroll) reveals without needing a scroll.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced, threshold]);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn(
        "transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        className,
      )}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translate3d(0, ${distance}px, 0)`,
        transitionDelay: shown ? `${delay}ms` : "0ms",
        willChange: shown ? undefined : "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}
