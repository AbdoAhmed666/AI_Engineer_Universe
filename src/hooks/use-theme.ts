/**
 * Hook for consuming the theme context.
 *
 * Provides access to the current theme, the resolved theme (light/dark),
 * and functions to set or toggle the theme.
 *
 * Must be used within a `ThemeProvider`.
 */

import { useContext } from "react";
import { ThemeContext } from "@/context/theme-context";
import type { ThemeContextValue } from "@/lib/types";

/**
 * Returns the theme context value.
 *
 * @throws {Error} If used outside of a `ThemeProvider`.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used within a ThemeProvider"
    );
  }

  return context;
}
