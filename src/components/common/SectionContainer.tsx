/**
 * Section container.
 *
 * A reusable, non-portfolio-specific layout primitive that provides
 * consistent vertical rhythm, a centered max-width content column, and an
 * optional Framer Motion entrance animation. It is intended as the
 * outermost wrapper for page sections but contains no portfolio-specific
 * content — callers supply the children.
 *
 * @example
 * import { SectionContainer } from "@/components/common";
 *
 * export default function AboutSection() {
 *   return (
 *     <SectionContainer id="about" title="About">
 *       <p>About content...</p>
 *     </SectionContainer>
 *   );
 * }
 */

"use client";

import type { ReactNode } from "react";
import { forwardRef } from "react";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  staggerContainer,
  staggerItem,
  transitions,
} from "@/lib/animations";

/**
 * Props for the {@link SectionContainer} component.
 */
export interface SectionContainerProps extends HTMLMotionProps<"section"> {
  /** Section content. */
  children: ReactNode;
  /** Optional heading rendered above the content. */
  title?: string;
  /** Optional id for anchor navigation (e.g. `"about"`). */
  id?: string;
  /** When true, animates children with a stagger on viewport entry. Defaults to `true`. */
  animated?: boolean;
  /** Vertical spacing class. Defaults to `py-20 sm:py-28`. */
  spacingClass?: string;
}

/**
 * Reusable section wrapper with consistent spacing and optional animation.
 *
 * @param props - Section configuration, children, and native section attributes.
 * @returns The rendered section element.
 */
export const SectionContainer = forwardRef<HTMLElement, SectionContainerProps>(
  (
    {
      children,
      className,
      title,
      id,
      animated = true,
      spacingClass = "py-20 sm:py-28",
      ...props
    },
    ref
  ) => {
    const content = (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {title && (
          <motion.h2
            variants={staggerItem}
            className="mb-8 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            {title}
          </motion.h2>
        )}
        {children}
      </div>
    );

    return (
      <motion.section
        ref={ref}
        id={id}
        initial={animated ? "hidden" : false}
        whileInView={animated ? "visible" : undefined}
        viewport={animated ? { once: true } : undefined}
        variants={animated ? staggerContainer : undefined}
        transition={transitions.smooth}
        className={cn("w-full", spacingClass, className)}
        {...props}
      >
        {animated ? content : <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{title && (
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
        )}{children}</div>}
      </motion.section>
    );
  }
);

SectionContainer.displayName = "SectionContainer";