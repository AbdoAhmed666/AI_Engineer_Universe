/**
 * BOOT viewport gate.
 *
 * Holds a CSS BOOT sequence until its block is on screen. The schematic sits
 * below the fold at every common viewport — measured at 0–7% visible on
 * load — so a sequence scheduled from first paint finishes before anyone
 * can see it. This restarts it at the moment the block is reached.
 *
 * It is deliberately a thin wrapper around server-rendered children: the
 * children stay server components, and the only client cost is the
 * observer. It also degrades in three useful directions —
 *
 * - no JavaScript: the class is never added and BOOT plays at load;
 * - reduced motion: the gesture rules do not exist, so there is nothing
 *   to hold and the effect returns early;
 * - held but never released: the reset state is each element's own final
 *   style, so the content is fully readable either way.
 *
 * The class is only ever applied to a block that is already off screen, so
 * resetting the animation is never visible.
 *
 * @example
 * <BootInView className="mt-20">
 *   <SystemSchematic />
 * </BootInView>
 */

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Props for the {@link BootInView} component.
 */
export interface BootInViewProps {
  /** Server-rendered content carrying the BOOT gesture classes. */
  children: ReactNode;
  className?: string;
  /**
   * Root margin for the observer. The default starts the sequence a little
   * before the block enters the viewport, so the first frames are never
   * clipped by the fold.
   */
  rootMargin?: string;
  /**
   * Fraction of the block that must be on screen before BOOT starts. A
   * single visible pixel is not enough: the sequence runs for 700ms and
   * should not begin while only its top edge is showing.
   */
  releaseRatio?: number;
}

/**
 * Defers a BOOT sequence until its block enters the viewport.
 *
 * @param props - Children, class name and observer margin.
 * @returns The wrapping element.
 */
export function BootInView({
  children,
  className,
  rootMargin = "0px",
  releaseRatio = 0.3,
}: BootInViewProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  // Starts false so the server and client render the same markup.
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const wrapper = ref.current;
    if (!wrapper || typeof IntersectionObserver === "undefined") return;

    // Under reduced motion there is no sequence to hold.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Measure the drawing rather than the wrapper. A schematic's caption can
    // be on screen while every animated element is still below the fold, so
    // the wrapper's own box would release the sequence far too early.
    const element =
      wrapper.querySelector<HTMLElement>("[data-boot-anchor]") ?? wrapper;

    // Whole block already on screen: the sequence running since first paint
    // will be seen in full, so leave it alone rather than restarting it.
    const box = element.getBoundingClientRect();
    if (box.top >= 0 && box.bottom <= window.innerHeight) return;

    setHeld(true);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Release once enough of the block is showing, or — for a block
          // taller than the viewport, where the ratio can never reach the
          // threshold — once it has reached the top of the screen.
          if (
            entry.intersectionRatio >= releaseRatio ||
            entry.boundingClientRect.top <= 0
          ) {
            setHeld(false);
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin, threshold: [0, releaseRatio] }
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin, releaseRatio]);

  return (
    <div ref={ref} className={cn(className, held && "motion-hold")}>
      {children}
    </div>
  );
}

export default BootInView;
