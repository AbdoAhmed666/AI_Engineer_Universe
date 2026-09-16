/**
 * Scroll progress indicator.
 *
 * A thin, fixed progress bar that visualizes how far the user has
 * scrolled through the page. The progress is driven by Framer Motion's
 * `useScroll` and smoothed with `useSpring` for a polished feel. The
 * bar uses semantic CSS variable colors so it adapts automatically to
 * light and dark themes, and its stacking order comes from `zIndex`.
 *
 * This is a client component because it relies on browser scroll state
 * and Framer Motion hooks.
 *
 * @example
 * import { ScrollProgress } from "@/components/layout";
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       <ScrollProgress />
 *       {children}
 *     </>
 *   );
 * }
 */

"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { zIndex } from "@/lib/constants";
import { transitions } from "@/lib/animations";

/**
 * Props for the {@link ScrollProgress} component.
 */
export interface ScrollProgressProps extends HTMLMotionProps<"div"> {
  /** Height of the progress bar in Tailwind units. Defaults to `h-1`. */
  heightClass?: string;
}

/**
 * Animated scroll progress bar fixed to the top of the viewport.
 *
 * @param props - Progress bar configuration and native div attributes.
 * @returns The rendered scroll progress bar.
 */
export function ScrollProgress({
  className,
  heightClass = "h-1",
  ...props
}: ScrollProgressProps): React.ReactElement {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: transitions.spring.stiffness,
    damping: transitions.spring.damping,
  });

  return (
    <motion.div
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ scaleX, zIndex: zIndex.sticky }}
      className={cn(
        "fixed inset-x-0 top-0 origin-left bg-primary",
        heightClass,
        className
      )}
      {...props}
    />
  );
}