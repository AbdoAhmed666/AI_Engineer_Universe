/**
 * Reusable Framer Motion animation variants.
 * These variants can be used with motion components to create
 * consistent, reusable animations across the application.
 */

import type { Variants } from "framer-motion";
import type { AnimationOptions } from "./types";
import { animationDuration, easings } from "./constants";

// ─── Base Variants ───────────────────────────────────────────────────────

/** Fade in from transparent to opaque */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Slide up from below */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
};

/** Slide down from above */
export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -40 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -40 },
};

/** Slide in from the left */
export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 40 },
};

/** Slide in from the right */
export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

/** Scale from 0 to 1 */
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

/** Bounce effect */
export const bounceVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      y: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
  },
  exit: { opacity: 0, y: -20 },
};

// ─── Stagger Variants ────────────────────────────────────────────────────

/**
 * Container variant for staggered children animations.
 * Use with `variants={staggerContainer}` and `initial="hidden" animate="visible"`.
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: { opacity: 0 },
};

/**
 * Child variant for use within a stagger container.
 * Each child will fade and slide up with a delay based on its position.
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easings.standard,
    },
  },
  exit: { opacity: 0, y: 20 },
};

// ─── Animation Factory ───────────────────────────────────────────────────

/**
 * Creates animation variants with custom timing options.
 *
 * @example
 * const variants = createVariants("slideUp", { delay: 0.2, duration: 0.6 })
 */
export function createVariants(
  type: "fade" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "scale",
  options: AnimationOptions = {}
): Variants {
  const { delay = 0, duration = animationDuration.normal / 1000, ease = easings.standard } = options;

  const baseVariants: Record<string, Variants> = {
    fade: fadeVariants,
    slideUp: slideUpVariants,
    slideDown: slideDownVariants,
    slideLeft: slideLeftVariants,
    slideRight: slideRightVariants,
    scale: scaleVariants,
  };

  const base = baseVariants[type];
  const baseVisible = base.visible as Record<string, unknown>;

  return {
    hidden: base.hidden,
    visible: {
      ...baseVisible,
      transition: {
        duration,
        ease,
        delay,
        ...(baseVisible.transition as Record<string, unknown>),
      },
    },
    exit: base.exit,
  };
}

// ─── Transition Presets ──────────────────────────────────────────────────

export const transitions = {
  smooth: {
    duration: animationDuration.normal / 1000,
    ease: easings.standard,
  },
  fast: {
    duration: animationDuration.fast / 1000,
    ease: easings.easeOut,
  },
  slow: {
    duration: animationDuration.slow / 1000,
    ease: easings.emphasizedDecelerate,
  },
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 25,
  },
  bounce: {
    type: "spring",
    stiffness: 400,
    damping: 10,
  },
} as const;

// ─── Hover & Tap Animations ───────────────────────────────────────────────

export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2, ease: easings.easeOut },
};

export const tapScale = {
  scale: 0.95,
  transition: { duration: 0.1, ease: easings.easeOut },
};

export const hoverRotate = {
  rotate: 5,
  transition: { duration: 0.3, ease: easings.standard },
};
