/**
 * Reusable Framer Motion animation variants.
 * These variants can be used with motion components to create
 * consistent, reusable animations across the application.
 */

import type { Variants } from "framer-motion";
import { animationDuration, easings } from "./constants";

// ─── Base Variants ───────────────────────────────────────────────────────

/** Fade in from transparent to opaque */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Slide down from above */
export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -40 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -40 },
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
