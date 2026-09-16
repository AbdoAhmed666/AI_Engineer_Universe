/**
 * Page transition wrapper.
 *
 * A reusable wrapper that animates its children in (and out) using Framer
 * Motion. It is designed to wrap page-level content so that route changes
 * receive a consistent fade-and-slide entrance. The animation variants and
 * timing are sourced from `@/lib/animations` — no hardcoded values.
 *
 * @example
 * import { PageTransition } from "@/components/common";
 *
 * export default function Page() {
 *   return (
 *     <PageTransition>
 *       <Hero />
 *     </PageTransition>
 *   );
 * }
 */

"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeVariants, transitions } from "@/lib/animations";

/**
 * Props for the {@link PageTransition} component.
 */
export interface PageTransitionProps extends HTMLMotionProps<"div"> {
  /** The page content to animate. */
  children: ReactNode;
  /** When true, animates on every viewport entry. Defaults to `false`. */
  repeat?: boolean;
}

/**
 * Wraps page content with a Framer Motion fade-and-slide transition.
 *
 * @param props - Transition configuration, children, and native div attributes.
 * @returns The animated wrapper element.
 */
export function PageTransition({
  children,
  className,
  repeat = false,
  ...props
}: PageTransitionProps): React.ReactElement {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeVariants}
      transition={transitions.smooth}
      viewport={repeat ? { once: false } : undefined}
      className={cn("w-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}