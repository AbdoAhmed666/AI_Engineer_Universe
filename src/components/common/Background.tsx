/**
 * Animated decorative background.
 *
 * A reusable, non-portfolio-specific animated background built entirely
 * with Framer Motion (no Three.js, no Canvas). Renders a subtle technical
 * grid texture, a radial fade mask, and a set of softly animated gradient
 * glow orbs that adapt to light and dark themes via semantic CSS variable
 * colors. The component is purely decorative and hidden from assistive
 * technology.
 *
 * @example
 * import { Background } from "@/components/common";
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       <Background />
 *       <main>{children}</main>
 *     </>
 *   );
 * }
 */

"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { zIndex } from "@/lib/constants";
import { transitions } from "@/lib/animations";

/**
 * Props for the {@link Background} component.
 */
export interface BackgroundProps extends HTMLMotionProps<"div"> {
  /** When true, the background is fixed to the viewport. Defaults to `true`. */
  fixed?: boolean;
}

/**
 * Descriptor for a single animated glow orb layer.
 */
interface OrbConfig {
  /** Tailwind class string controlling position and size. */
  className: string;
  /** Animation delay in seconds. */
  delay: number;
}

/**
 * Reusable animated background with theme-aware gradient orbs and a
 * subtle technical grid texture.
 *
 * @param props - Background configuration and native div attributes.
 * @returns The rendered background element.
 */
export function Background({
  className,
  fixed = true,
  ...props
}: BackgroundProps): React.ReactElement {
  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none inset-0 overflow-hidden",
        fixed ? "fixed" : "absolute",
        className
      )}
      style={{ zIndex: zIndex.base }}
      {...props}
    >
      {/* Subtle technical grid texture */}
      <div
        className={cn(
          "absolute inset-0 bg-grid opacity-[0.15] dark:opacity-[0.08]",
          "mask-fade-radial"
        )}
      />

      {/* Animated glow orbs */}
      <div className="absolute inset-0">
        {orbs.map((orb, index) => (
          <motion.div
            key={index}
            className={cn(
              "absolute rounded-full bg-primary/15 blur-3xl",
              orb.className
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [0.8, 1.1, 0.8],
              x: [0, 20, 0],
              y: [0, -15, 0],
            }}
            transition={{
              ...transitions.slow,
              repeat: Infinity,
              delay: orb.delay,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Orb Layers ──────────────────────────────────────────────────────────────

/**
 * Static configuration for the animated glow orb layers. Positions and
 * delays are defined here rather than hardcoded inline for clarity.
 */
const orbs: OrbConfig[] = [
  { className: "left-[-10%] top-[-10%] h-[40vh] w-[40vh]", delay: 0 },
  { className: "right-[-10%] top-[20%] h-[35vh] w-[35vh]", delay: 0.5 },
  { className: "bottom-[-10%] left-[30%] h-[45vh] w-[45vh]", delay: 1 },
];
