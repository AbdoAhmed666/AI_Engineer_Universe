/**
 * Barrel exports for the context module.
 *
 * Re-exports all context providers and their underlying context objects
 * so they can be imported from a single entry point.
 *
 * @example
 * import { LoadingProvider } from "@/context";
 */

export { LoadingProvider, LoadingContext } from "./loading-context";
export type { LoadingProviderProps } from "./loading-context";
