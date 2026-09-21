"use client";

import { useEffect } from "react";

/**
 * Marks the document once React is running on the client.
 *
 * The layout schedules a fallback that reveals animation-hidden content if
 * hydration has not happened within a couple of seconds; this is what tells
 * that timer to stand down. Renders nothing.
 */
export function HydrationFlag() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "1";
  }, []);

  return null;
}
