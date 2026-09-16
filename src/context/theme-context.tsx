/**
 * Theme context provider.
 *
 * Manages the application's color scheme (light / dark / system) and
 * persists the user's preference to `localStorage`. The resolved theme
 * (the actual light or dark value applied to the DOM) is derived from
 * the preference and the user's OS-level `prefers-color-scheme` setting.
 *
 * The provider exposes a `ThemeContextValue` that is consumed by the
 * `useTheme` hook.
 */

"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Theme, ThemeContextValue } from "@/lib/types";
import { isBrowser } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "theme";
const DEFAULT_THEME: Theme = "system";

// ─── Context ─────────────────────────────────────────────────────────────────

/**
 * The default context value.
 *
 * A separate `ThemeContext` is created with `null` as the default so that
 * we can detect consumers that are used outside of a `ThemeProvider`.
 */
const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Initial theme preference. Defaults to `"system"`. */
  defaultTheme?: Theme;
  /** Storage key used to persist the preference. Defaults to `"theme"`. */
  storageKey?: string;
}

/**
 * Resolves a `"system"` theme preference to either `"light"` or `"dark"`
 * based on the user's OS-level `prefers-color-scheme` media query.
 */
function getSystemTheme(): "light" | "dark" {
  if (!isBrowser()) {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Reads the stored theme preference from `localStorage`.
 * Falls back to `defaultTheme` when no preference is stored or when
 * running in a non-browser environment.
 */
function getStoredTheme(defaultTheme: Theme): Theme {
  if (!isBrowser()) {
    return defaultTheme;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage may be unavailable (e.g. private browsing, SSR)
  }
  return defaultTheme;
}

/**
 * Applies the resolved theme to the document element by setting the
 * `class` attribute and the `data-theme` attribute.
 */
function applyThemeToDOM(resolvedTheme: "light" | "dark"): void {
  if (!isBrowser()) {
    return;
  }
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  root.setAttribute("data-theme", resolvedTheme);
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getStoredTheme(defaultTheme)
  );

  // Compute the resolved theme (light or dark) from the preference.
  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (theme === "system") {
      return getSystemTheme();
    }
    return theme;
  }, [theme]);

  // Apply the resolved theme to the DOM whenever it changes.
  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, [resolvedTheme]);

  // Listen for OS-level theme changes when the preference is "system".
  useEffect(() => {
    if (theme !== "system" || !isBrowser()) {
      return;
    }

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleChange = () => {
      // Force a re-render by toggling a dummy state.
      // The resolvedTheme memo will recompute based on the new media query.
      setThemeState((prev) => prev);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Persist the theme preference to localStorage.
  const setTheme = useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);
      if (isBrowser()) {
        try {
          localStorage.setItem(storageKey, nextTheme);
        } catch {
          // localStorage may be unavailable
        }
      }
    },
    [storageKey]
  );

  // Toggle between light and dark (skipping "system").
  const toggleTheme = useCallback(() => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export { ThemeContext };
