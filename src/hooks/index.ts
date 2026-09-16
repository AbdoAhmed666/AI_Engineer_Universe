/**
 * Barrel exports for the hooks module.
 *
 * Re-exports all custom hooks so they can be imported from a single entry point.
 *
 * @example
 * import { useLoading, useAnimation, useSmoothScroll } from "@/hooks";
 */

export { useLoading } from "./use-loading";
export { useAnimation } from "./use-animation";
export { useSmoothScroll } from "./use-smooth-scroll";
export type { SmoothScrollOptions } from "./use-smooth-scroll";
