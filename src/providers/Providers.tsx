/**
 * Application providers composition.
 *
 * Composes the application's context providers into a single client
 * component so the rest of the app can wrap its tree once.
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
import { LoadingProvider } from "@/context";
import type { LoadingProviderProps } from "@/context";

/**
 * Props for the {@link Providers} component.
 */
export interface ProvidersProps
  extends Pick<LoadingProviderProps, "minDisplayTimeMs" | "fadeOutDurationMs"> {
  /** The application subtree made available to the providers. */
  children: ReactNode;
}

/**
 * Composes the application providers around `children`.
 *
 * @param props - The composed provider configuration and children.
 * @returns The wrapped application subtree.
 */
export function Providers({
  children,
  minDisplayTimeMs,
  fadeOutDurationMs,
}: ProvidersProps): ReactNode {
  return (
    <LoadingProvider
      minDisplayTimeMs={minDisplayTimeMs}
      fadeOutDurationMs={fadeOutDurationMs}
    >
      {children}
    </LoadingProvider>
  );
}
