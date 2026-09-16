/**
 * Application providers composition.
 *
 * Composes the theme and loading context providers into a single
 * client component so the rest of the app can wrap its tree once.
 *
 * The `ThemeProvider` is placed outermost so that the loading screen
 * (and any descendant) can consume the theme via the `useTheme` hook.
 * The `LoadingProvider` is nested inside, exposing the loading
 * lifecycle through the `useLoading` hook.
 *
 * @example
 * import { Providers } from "@/providers";
 *
 * export default function RootLayout({ children }) {
 *   return <Providers>{children}</Providers>;
 * }
 */

"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/context";
import { LoadingProvider } from "@/context";
import type { ThemeProviderProps } from "@/context";
import type { LoadingProviderProps } from "@/context";

/**
 * Props for the {@link Providers} component.
 *
 * Extends the optional configuration of both composed providers so
 * callers can customize theme and loading behavior from a single
 * entry point.
 */
export interface ProvidersProps
  extends Pick<ThemeProviderProps, "defaultTheme" | "storageKey">,
    Pick<LoadingProviderProps, "minDisplayTimeMs" | "fadeOutDurationMs"> {
  /** The application subtree made available to both providers. */
  children: ReactNode;
}

/**
 * Composes `ThemeProvider` and `LoadingProvider` around `children`.
 *
 * @param props - The composed provider configuration and children.
 * @returns The wrapped application subtree.
 */
export function Providers({
  children,
  defaultTheme,
  storageKey,
  minDisplayTimeMs,
  fadeOutDurationMs,
}: ProvidersProps): ReactNode {
  return (
    <ThemeProvider defaultTheme={defaultTheme} storageKey={storageKey}>
      <LoadingProvider
        minDisplayTimeMs={minDisplayTimeMs}
        fadeOutDurationMs={fadeOutDurationMs}
      >
        {children}
      </LoadingProvider>
    </ThemeProvider>
  );
}