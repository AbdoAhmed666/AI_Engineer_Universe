/**
 * Full-screen loading screen.
 *
 * Renders an animated overlay while the application is loading and fades
 * out once the loading lifecycle completes. The visibility and state are
 * driven entirely by the existing `LoadingContext` (via the `useLoading`
 * hook), and all timing values come from `loadingConfig` — no hardcoded
 * values.
 *
 * The component is a client component because it consumes context and
 * uses Framer Motion animations.
 *
 * @example
 * import { LoadingScreen } from "@/components/layout";
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       <LoadingScreen />
 *       {children}
 *     </>
 *   );
 * }
 */

"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLoading } from "@/hooks/use-loading";
import { loadingConfig, zIndex } from "@/lib/constants";
import { fadeVariants, transitions } from "@/lib/animations";

/**
 * Props for the {@link LoadingScreen} component.
 */
export interface LoadingScreenProps extends HTMLMotionProps<"div"> {
  /** Optional label announced to assistive tech while loading. */
  label?: string;
}

/**
 * Animated full-screen loading overlay driven by `LoadingContext`.
 *
 * @param props - Loading screen configuration and native div attributes.
 * @returns The rendered loading overlay (or `null` when hidden).
 */
export function LoadingScreen({
  className,
  label = "Loading",
  ...props
}: LoadingScreenProps): React.ReactElement | null {
  const { isLoading, loadingState, markAsLoaded } = useLoading();

  // Notify the context that the app has mounted so the minimum display
  // time can be enforced before transitioning to "loaded".
  useEffect(() => {
    markAsLoaded();
  }, [markAsLoaded]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label={label}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fadeVariants}
          transition={transitions.slow}
          className={cn(
            "fixed inset-0 flex items-center justify-center",
            "bg-background text-foreground",
            className
          )}
          style={{ zIndex: zIndex.loading }}
          {...props}
        >
          <div className="flex flex-col items-center gap-4">
            <Spinner />
            <span className="text-sm font-medium text-muted-foreground">
              {loadingState === "loading" ? label : ""}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

/**
 * Animated indeterminate spinner built with Framer Motion.
 *
 * The rotation duration is derived from `loadingConfig` so there are no
 * hardcoded timing values.
 */
function Spinner(): React.ReactElement {
  const rotationDuration = loadingConfig.minDisplayTime / 1000;

  return (
    <motion.span
      className="inline-block h-10 w-10 rounded-full border-2 border-muted border-t-foreground"
      animate={{ rotate: 360 }}
      transition={{
        duration: rotationDuration,
        ease: "linear",
        repeat: Infinity,
      }}
      aria-hidden="true"
    />
  );
}