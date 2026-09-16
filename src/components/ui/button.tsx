/**
 * Button component.
 *
 * A reusable button built on top of the native `<button>` element with
 * support for multiple visual variants and sizes. Uses `framer-motion`
 * for hover and tap animations, and `clsx` + `tailwind-merge` for
 * conflict-free class composition.
 */

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { hoverScale, tapScale } from "@/lib/animations";
import type { ButtonProps } from "@/lib/types";

/**
 * Maps each button variant to its corresponding Tailwind CSS classes.
 */
const variantClasses = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost:
    "bg-transparent hover:bg-accent hover:text-accent-foreground",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
} as const;

/**
 * Maps each button size to its corresponding padding and font size.
 */
const sizeClasses = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        whileHover={hoverScale}
        whileTap={tapScale}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
