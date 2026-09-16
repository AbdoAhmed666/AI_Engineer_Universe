/**
 * Scroll reveal.
 *
 * A small client wrapper that lifts its children into place the first time
 * they enter the viewport. It animates transform only — never opacity — so
 * content is fully visible in the prerendered HTML and without JavaScript.
 * Under `prefers-reduced-motion` the global `MotionConfig` skips the
 * transform entirely.
 *
 * @example
 * <Reveal delay={0.1}>
 *   <CaseStudy />
 * </Reveal>
 */

"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { easings } from "@/lib/constants";

/**
 * Props for the {@link Reveal} component.
 */
export interface RevealProps {
  children: ReactNode;
  /** Delay in seconds before the reveal starts. */
  delay?: number;
  className?: string;
}

/**
 * Reveals children with a short upward movement on first viewport entry.
 *
 * @param props - Children, optional delay and class name.
 * @returns The animated wrapper.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: RevealProps): React.ReactElement {
  return (
    <motion.div
      className={className}
      initial={{ y: 16 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: easings.emphasized, delay }}
    >
      {children}
    </motion.div>
  );
}
