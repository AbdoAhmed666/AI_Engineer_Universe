/**
 * Barrel exports for the context module.
 *
 * Re-exports all context providers and their underlying context objects
 * so they can be imported from a single entry point.
 *
 * @example
 * import { ThemeProvider, LoadingProvider } from "@/context";
 */

export { ThemeProvider, ThemeContext } from "./theme-context";
export type { ThemeProviderProps } from "./theme-context";

export { LoadingProvider, LoadingContext } from "./loading-context";
export type { LoadingProviderProps } from "./loading-context";
