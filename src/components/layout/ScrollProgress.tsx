/**
 * Scroll progress indicator.
 *
 * A 1px accent line that grows with page scroll. It is designed to sit on
 * the bottom edge of the header, so it never overlaps the navigation. The
 * progress is driven by Framer Motion's `useScroll` and smoothed with
 * `useSpring`. Purely decorative, so it is hidden from assistive technology.
 *
 * @example
 * <header className="relative">
 *   ...
 *   <ScrollProgress />
 * </header>
 */

"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/animations";

/**
 * Props for the {@link ScrollProgress} component.
 */
export interface ScrollProgressProps {
  className?: string;
}

/**
 * Scroll progress line anchored to the bottom of its positioned parent.
 *
 * @param props - Optional class name overrides.
 * @returns The rendered progress line.
 */
export function ScrollProgress({
  className,
}: ScrollProgressProps): React.ReactElement {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: transitions.spring.stiffness,
    damping: transitions.spring.damping,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className={cn(
        "absolute inset-x-0 -bottom-px h-px origin-left bg-accent",
        className
      )}
    />
  );
}
