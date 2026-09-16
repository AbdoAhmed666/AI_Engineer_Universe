/**
 * Barrel exports for the UI components module.
 *
 * Re-exports all base UI components so they can be imported from a
 * single entry point.
 *
 * @example
 * import { Button, ThemeToggle } from "@/components/ui";
 */

export { Button } from "./button";
export type { ButtonProps } from "@/lib/types";

export { ThemeToggle } from "./theme-toggle";
export type { ThemeToggleProps } from "./theme-toggle";
