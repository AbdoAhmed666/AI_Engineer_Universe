/**
 * Utility functions used across the application.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names using clsx and tailwind-merge.
 * Handles conditional classes and resolves Tailwind CSS conflicts.
 *
 * @example
 * cn("px-2 py-1", "px-4", condition && "bg-accent")
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
