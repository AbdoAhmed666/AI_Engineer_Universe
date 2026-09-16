/**
 * Hook for animation utilities.
 *
 * Wraps the reusable Framer Motion variants and transition presets from
 * `@/lib/animations` into a convenient API. Provides:
 *
 * - `getVariants` — returns Framer Motion `Variants` for a given animation type
 * - `transitions` — pre-configured transition objects
 * - `hover`/`tap` — hover and tap animation props for `motion` components
 * - `onceInView` — a `whileInView` / `viewport` configuration for
 *   scroll-triggered animations that fire only once
 */

import { useMemo } from "react";
import type { Variants } from "framer-motion";
import type { AnimationOptions, AnimationVariant } from "@/lib/types";
import {
  createVariants,
  transitions,
  hoverScale,
  tapScale,
  hoverRotate,
  fadeVariants,
  slideUpVariants,
  slideDownVariants,
  slideLeftVariants,
  slideRightVariants,
  scaleVariants,
  bounceVariants,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";

/**
 * A map of animation variant names to their corresponding Framer Motion
 * `Variants` objects.
 */
const variantMap: Record<Exclude<AnimationVariant, "stagger">, Variants> = {
  fade: fadeVariants,
  slideUp: slideUpVariants,
  slideDown: slideDownVariants,
  slideLeft: slideLeftVariants,
  slideRight: slideRightVariants,
  scale: scaleVariants,
  bounce: bounceVariants,
};

/**
 * Returns the appropriate Framer Motion `Variants` for the given
 * animation type and options.
 *
 * For `"stagger"`, returns the stagger container variants.
 * For `"bounce"`, returns the bounce variants directly.
 * For all other types, uses `createVariants` to apply custom timing.
 */
function getVariants(
  type: AnimationVariant,
  options: AnimationOptions = {}
): Variants {
  if (type === "stagger") {
    return staggerContainer;
  }

  if (type === "bounce") {
    return bounceVariants;
  }

  return createVariants(type, options);
}

/**
 * Returns a `whileInView` configuration that triggers the animation
 * only once when the element enters the viewport.
 *
 * @param type - The animation variant to use.
 * @param options - Optional timing overrides.
 */
function onceInView(
  type: AnimationVariant,
  options: AnimationOptions = {}
) {
  const variants = getVariants(type, options);

  return {
    initial: "hidden",
    variants,
    whileInView: "visible",
    viewport: { once: true, amount: options.once ? 0.1 : 0 },
  };
}

/**
 * Animation utilities hook.
 *
 * @returns An object containing variant generators, transition presets,
 *          hover/tap props, and scroll-triggered animation helpers.
 */
export function useAnimation() {
  return useMemo(
    () => ({
      getVariants,
      onceInView,
      transitions,
      hoverScale,
      tapScale,
      hoverRotate,
      staggerContainer,
      staggerItem,
    }),
    []
  );
}
