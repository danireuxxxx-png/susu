"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode[];
  /** Announced to screen readers as the list's purpose. */
  label: string;
  /**
   * Classes applied to the track above the `sm` breakpoint, where the rail
   * becomes a grid. The rail itself is the mobile-first default.
   */
  gridClassName?: string;
  /** Classes for each item at `sm` and up. */
  itemClassName?: string;
  className?: string;
};

/**
 * A horizontal, snapping rail on phones that becomes a static grid from the
 * `sm` breakpoint up.
 *
 * The switch is pure CSS on a single DOM tree — no media-query hook, no
 * duplicated markup, so there is no hydration mismatch and no flash of the
 * wrong layout on a desktop first paint. The dots are driven by the track's
 * own scroll position, so they stay correct whether the visitor swipes,
 * flicks, or uses a trackpad.
 *
 * On a grid there is nothing to scroll, so the dot row hides itself above
 * `sm` and the scroll handler settles on index 0 and stops mattering.
 */
export function Rail({
  children,
  label,
  gridClassName = "sm:grid sm:grid-cols-2 lg:grid-cols-3",
  itemClassName,
  className,
}: Props) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.firstElementChild as HTMLElement | null;
    if (!first) return;
    // Item pitch includes the gap, so this stays right at any card width.
    const pitch = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0");
    if (pitch <= 0) return;
    setActive(Math.round(track.scrollLeft / pitch));
  }, []);

  const goTo = (index: number) => {
    const track = trackRef.current;
    const item = track?.children[index] as HTMLElement | undefined;
    item?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  return (
    /* `min-w-0`: without it a rail placed in a grid or flex item inherits
       `min-width: auto`, the track grows to fit its cards instead of
       scrolling, and the page gains horizontal overflow. */
    <div className={cn("min-w-0", className)}>
      <ul
        ref={trackRef}
        onScroll={onScroll}
        aria-label={label}
        className={cn(
          // Rail (phones): bleeds into the page gutter so a card can sit
          // flush with the screen edge while still snapping to the margin.
          "-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-6 px-6 pb-2",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "overscroll-x-contain",
          // Grid (sm and up): the bleed and the snapping are undone.
          "sm:mx-0 sm:snap-none sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0",
          gridClassName,
        )}
      >
        {children.map((child, i) => (
          <li
            key={i}
            className={cn(
              "flex w-[78vw] max-w-[20rem] shrink-0 snap-start",
              "sm:w-auto sm:max-w-none sm:shrink",
              itemClassName,
            )}
          >
            {child}
          </li>
        ))}
      </ul>

      {children.length > 1 && (
        <div
          className="mt-5 flex justify-center gap-1.5 sm:hidden"
          role="tablist"
          aria-label={`${label} — navegação`}
        >
          {children.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Ir para o item ${i + 1} de ${children.length}`}
              onClick={() => goTo(i)}
              // 44px touch target around a 6px dot.
              className="grid size-11 place-items-center"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  i === active ? "w-5 bg-ink" : "w-1.5 bg-line-strong",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
