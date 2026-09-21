"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a media query.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: a media query
 * is external state React does not own, and reading it this way avoids the
 * extra render (and the cascading-render lint error) that setting state
 * inside an effect causes. Returns `false` during SSR.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True when the visitor has asked the OS to minimise motion. */
export const usePrefersReducedMotion = () =>
  useMediaQuery("(prefers-reduced-motion: reduce)");

/** True on pointer-precise devices — gates the custom cursor. */
export const useHasFinePointer = () =>
  useMediaQuery("(hover: hover) and (pointer: fine)");

const subscribeToScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};

/**
 * True once the page is scrolled past `threshold` pixels.
 *
 * Reading the snapshot on subscribe means a page restored mid-scroll gets
 * the right answer on its first paint, without an effect writing state.
 */
export function useScrolledPast(threshold: number): boolean {
  return useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > threshold,
    () => false,
  );
}
