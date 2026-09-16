/**
 * Barrel exports for the common components module.
 *
 * Re-exports reusable, non-portfolio-specific components so they can be
 * imported from a single entry point.
 *
 * @example
 * import { Background, PageTransition, SectionContainer } from "@/components/common";
 */

export { Background } from "./Background";
export type { BackgroundProps } from "./Background";

export { PageTransition } from "./PageTransition";
export type { PageTransitionProps } from "./PageTransition";

export { SectionContainer } from "./SectionContainer";
export type { SectionContainerProps } from "./SectionContainer";