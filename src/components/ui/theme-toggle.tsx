/**
 * Theme toggle button.
 *
 * A button that toggles between light and dark themes. Displays a
 * sun or moon icon depending on the current resolved theme. Uses the
 * `useTheme` hook to access and update the theme context.
 */

import { forwardRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { hoverScale, tapScale } from "@/lib/animations";

export interface ThemeToggleProps extends HTMLMotionProps<"button"> {
  /** When true, shows only the icon without text. */
  iconOnly?: boolean;
}

export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(
  ({ className, iconOnly = false, ...props }, ref) => {
    const { resolvedTheme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch: the server always renders "light" while
    // the client may resolve to "dark". Render a stable placeholder until
    // the component has mounted on the client.
    useEffect(() => {
      setMounted(true);
    }, []);

    const isDark = mounted && resolvedTheme === "dark";

    return (
      <motion.button
        ref={ref}
        type="button"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "focus-visible:ring-offset-2",
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          iconOnly
            ? "h-9 w-9"
            : "h-10 px-4 text-sm",
          className
        )}
        whileHover={hoverScale}
        whileTap={tapScale}
        onClick={toggleTheme}
        {...props}
      >
        <motion.span
          key={isDark ? "sun" : "moon"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <SunIcon className="h-4 w-4" />
          ) : (
            <MoonIcon className="h-4 w-4" />
          )}
        </motion.span>
        {!iconOnly && (
          <span className="ml-2">
            {isDark ? "Light" : "Dark"}
          </span>
        )}
      </motion.button>
    );
  }
);

ThemeToggle.displayName = "ThemeToggle";

// ─── Icons ───────────────────────────────────────────────────────────────────

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx={12} cy={12} r={5} />
      <line x1={12} y1={1} x2={12} y2={3} />
      <line x1={12} y1={21} x2={12} y2={23} />
      <line x1={4.22} y1={4.22} x2={5.64} y2={5.64} />
      <line x1={18.36} y1={18.36} x2={19.78} y2={19.78} />
      <line x1={1} y1={12} x2={3} y2={12} />
      <line x1={21} y1={12} x2={23} y2={12} />
      <line x1={4.22} y1={19.78} x2={5.64} y2={18.36} />
      <line x1={18.36} y1={5.64} x2={19.78} y2={4.22} />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
