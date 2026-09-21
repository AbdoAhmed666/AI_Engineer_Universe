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

// ─── Motion Vocabulary ────────────────────────────────────────────────────

/**
 * The six motion primitives of the site. One primitive per element, and at
 * most one *continuous* animation on screen at any time.
 *
 * - `boot`   — the one-time first-paint sequence that assembles the Hero
 *              schematic. Implemented (CSS, see `bootSequence`).
 * - `reveal` — content lifting into place on first viewport entry.
 *              Implemented (Framer, see {@link Reveal}).
 * - `trace`  — a stroke drawing itself along its own path. Implemented
 *              (CSS class `motion-trace`; requires `pathLength={1}`).
 * - `flow`   — NOT IMPLEMENTED. The signal travelling the pipeline. Will be
 *              the only continuous animation on the site, budgeted to the
 *              Hero, paused off-screen and static under reduced motion.
 * - `track`  — NOT IMPLEMENTED. Scroll-linked (scrubbed) motion: camera
 *              position, section progress. Jumps to its end state under
 *              reduced motion. Not decorative parallax.
 * - `focus`  — NOT IMPLEMENTED. Pointer/keyboard state change on an
 *              inspectable element. Colour only under reduced motion.
 */
export type MotionPrimitive =
  | "boot"
  | "reveal"
  | "trace"
  | "flow"
  | "track"
  | "focus";

// ─── Motion Tokens ────────────────────────────────────────────────────────

/**
 * Canonical motion durations, in milliseconds.
 *
 * These are the only durations the site uses. CSS mirrors them as the
 * `--motion-*` custom properties in `globals.css`; the split of ownership
 * is that CSS owns gesture *durations* and this module owns the BOOT
 * *schedule* (see {@link bootSequence}).
 */
export const motionDuration = {
  /** Immediate feedback — hover and focus colour changes. */
  instant: 120,
  /** Short state changes. */
  quick: 180,
  /** Default transition. */
  base: 300,
  /** Scroll reveal. */
  reveal: 600,
  /** One element of the BOOT sequence settling into place. */
  bootStep: 220,
} as const;

/**
 * {@link motionDuration} in seconds, for Framer Motion transitions.
 * Derived, so the milliseconds above stay the single source of truth.
 */
export const motionSeconds = {
  instant: motionDuration.instant / 1000,
  quick: motionDuration.quick / 1000,
  base: motionDuration.base / 1000,
  reveal: motionDuration.reveal / 1000,
  bootStep: motionDuration.bootStep / 1000,
  /** The only permitted offset between two sibling reveals. */
  stagger: 0.08,
} as const;

/**
 * The two easing curves of the site.
 *
 * `entrance` is used by anything arriving (BOOT, REVEAL, TRACE);
 * `state` by anything changing in place.
 */
export const motionEase = {
  entrance: easings.emphasized,
  state: easings.standard,
} as const;

// ─── BOOT Schedule ────────────────────────────────────────────────────────

/**
 * Timing of the BOOT sequence, in milliseconds.
 *
 * BOOT is an enhancement layered over content that is already in the
 * server-rendered HTML: the Hero's heading, lead, actions and links never
 * animate and are interactive from the first paint. What assembles is the
 * system schematic, and only the schematic.
 *
 * `stagger` and `rail` are deliberately paced together — the rail draws
 * across the nine stages at exactly `stagger` per stage, so the rail's
 * leading edge and the appearance of each node stay in step. The last
 * element finishes at `start + stagger * 8 + meta + bootStep` = 700ms.
 */
export const bootSequence = {
  /** Quiet window before anything moves, so nothing animates during first paint. */
  start: 150,
  /** Offset between consecutive pipeline stages. */
  stagger: 30,
  /** Rail draw duration. Equals `stagger * 8`, one step per stage gap. */
  rail: 240,
  /** Offset from a stage's node to its ordinal and label. */
  label: 60,
  /** Offset from a stage's node to its technology metadata. */
  meta: 90,
} as const;

/**
 * Timing of the Hero's entrance, in milliseconds.
 *
 * The Hero's own blocks lift into place with a transform, never a fade, so
 * the heading, lead and actions are readable and clickable from the first
 * paint. This runs at load — the Hero is always in view — while the
 * schematic's BOOT is deferred until it is actually on screen.
 *
 * Five blocks at `stagger` apart, each lasting `motionDuration.base`, so
 * the last one finishes at `start + stagger * 4 + base` = 640ms.
 */
export const heroEntrance = {
  /** Quiet window before the first block moves. */
  start: 60,
  /** Offset between consecutive Hero blocks. */
  stagger: 70,
} as const;

/**
 * Absolute delay for one block of the Hero entrance.
 *
 * @param blockIndex - Zero-based index of the block, top to bottom.
 * @returns The delay in milliseconds, measured from first paint.
 */
export function heroDelay(blockIndex: number): number {
  return heroEntrance.start + heroEntrance.stagger * blockIndex;
}

/**
 * Custom properties that position one element within a motion sequence.
 *
 * The gesture itself is a CSS class that only exists under
 * `prefers-reduced-motion: no-preference`; these variables supply its
 * schedule. Returned as a plain record so callers can cast it to
 * `CSSProperties` without this module depending on React.
 *
 * @param delayMs - Delay from first paint.
 * @param durationMs - Overrides the gesture's default duration.
 */
export function motionVars(
  delayMs: number,
  durationMs?: number
): Record<string, string> {
  const vars: Record<string, string> = { "--motion-delay": `${delayMs}ms` };
  if (durationMs !== undefined) {
    vars["--motion-duration"] = `${durationMs}ms`;
  }
  return vars;
}

/** The part of a stage being scheduled by {@link bootDelay}. */
export type BootPart = "node" | "label" | "meta";

/**
 * Absolute delay for one element of the BOOT sequence.
 *
 * Deterministic: a stage's position in the pipeline is the only input, so
 * the nine stages always read as one system assembling in order.
 *
 * @param stageIndex - Zero-based index of the stage within the pipeline.
 * @param part - Which part of the stage is being scheduled.
 * @returns The delay in milliseconds, measured from first paint.
 */
export function bootDelay(stageIndex: number, part: BootPart = "node"): number {
  const offset =
    part === "label"
      ? bootSequence.label
      : part === "meta"
        ? bootSequence.meta
        : 0;
  return bootSequence.start + bootSequence.stagger * stageIndex + offset;
}
