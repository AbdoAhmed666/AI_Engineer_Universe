/**
 * Hook for consuming the loading context.
 *
 * Provides access to the current loading state, a boolean `isLoading`
 * flag, and a `markAsLoaded` function to transition out of the loading
 * state.
 *
 * Must be used within a `LoadingProvider`.
 */

import { useContext } from "react";
import { LoadingContext } from "@/context/loading-context";
import type { LoadingContextValue } from "@/lib/types";

/**
 * Returns the loading context value.
 *
 * @throws {Error} If used outside of a `LoadingProvider`.
 */
export function useLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error(
      "useLoading must be used within a LoadingProvider"
    );
  }

  return context;
}
