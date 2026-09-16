/**
 * Hook for smooth scrolling to anchor elements.
 *
 * Provides a `scrollTo` function that smoothly scrolls the viewport to
 * a target element by ID, accounting for a configurable offset (e.g.
 * to compensate for a fixed header).
 *
 * Uses the `scrollConfig` constants for default duration and offset.
 */

import { useCallback } from "react";
import { scrollConfig } from "@/lib/constants";
import { isBrowser } from "@/lib/utils";

const { duration, offset } = scrollConfig;

export interface SmoothScrollOptions {
  /** Scroll duration in milliseconds. Defaults to `scrollConfig.duration`. */
  durationMs?: number;
  /** Offset in pixels from the target element. Defaults to `scrollConfig.offset`. */
  offsetPx?: number;
  /** Callback invoked after the scroll completes. */
  onComplete?: () => void;
}

/**
 * Smoothly scrolls the viewport to the element with the given ID.
 *
 * @param targetId - The ID of the target element (without the `#` prefix).
 * @param options - Optional configuration for duration, offset, and callback.
 */
export function useSmoothScroll() {
  const scrollTo = useCallback(
    (targetId: string, options: SmoothScrollOptions = {}) => {
      if (!isBrowser()) {
        return;
      }

      const { durationMs = duration, offsetPx = offset, onComplete } = options;

      const targetElement = document.getElementById(targetId);

      if (!targetElement) {
        return;
      }

      const targetPosition =
        targetElement.getBoundingClientRect().top +
        window.pageYOffset -
        offsetPx;

      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition;
      const startTime = performance.now();

      function step(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        // Ease-in-out cubic interpolation
        const eased =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        window.scrollTo(0, startPosition + distance * eased);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          onComplete?.();
        }
      }

      requestAnimationFrame(step);
    },
    [duration, offset]
  );

  return { scrollTo };
}
