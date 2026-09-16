/**
 * Button component.
 *
 * A reusable action with variants and sizes. Pass `href` to render an
 * anchor (navigation, in-page links, external links) and omit it to render
 * a native `<button>` (actions). Interaction feedback is color and border
 * only; focus uses the global `:focus-visible` outline.
 *
 * @example
 * <Button href="#projects">View projects</Button>
 * <Button variant="outline" onClick={retry}>Retry</Button>
 */

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Maps each button variant to its corresponding Tailwind CSS classes.
 */
const variantClasses = {
  primary: "bg-accent text-accent-foreground hover:bg-foreground",
  outline:
    "border border-line-strong text-foreground hover:border-accent hover:text-accent",
  ghost: "text-muted-foreground hover:bg-raised hover:text-foreground",
} as const;

/**
 * Maps each button size to its corresponding height, padding and type size.
 */
const sizeClasses = {
  sm: "h-9 px-3 text-small",
  md: "h-10 px-4 text-small",
  lg: "h-12 px-5 text-small",
} as const;

interface ButtonBaseProps {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof ButtonBaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof ButtonBaseProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Renders an anchor when `href` is provided, otherwise a `<button>`.
 *
 * @param props - Variant, size and native anchor or button attributes.
 * @returns The rendered action element.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps): React.ReactElement {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (props.href !== undefined) {
    return (
      <a className={classes} {...(props as ComponentPropsWithoutRef<"a">)}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      {...(props as ComponentPropsWithoutRef<"button">)}
    >
      {children}
    </button>
  );
}
