/**
 * Application providers composition.
 *
 * Wraps the tree in a single client boundary for app-wide configuration.
 * `MotionConfig` makes every Framer Motion animation respect the user's
 * `prefers-reduced-motion` setting: transform animations are skipped while
 * opacity changes remain.
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
import { MotionConfig } from "framer-motion";

/**
 * Props for the {@link Providers} component.
 */
export interface ProvidersProps {
  /** The application subtree. */
  children: ReactNode;
}

/**
 * Composes the application providers around `children`.
 *
 * @param props - The application subtree.
 * @returns The wrapped application subtree.
 */
export function Providers({ children }: ProvidersProps): ReactNode {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
