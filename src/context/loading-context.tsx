/**
 * Loading context provider.
 *
 * Manages the application's loading lifecycle. The provider tracks three
 * states — `"idle"`, `"loading"`, and `"loaded"` — and enforces a minimum
 * display time so that the loading screen is visible long enough to avoid
 * a flash of content on fast connections.
 *
 * The provider exposes a `LoadingContextValue` that is consumed by the
 * `useLoading` hook.
 */

"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { LoadingState, LoadingContextValue } from "@/lib/types";
import { loadingConfig } from "@/lib/constants";
import { isBrowser } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const { minDisplayTime, fadeOutDuration } = loadingConfig;

// ─── Context ─────────────────────────────────────────────────────────────────

/**
 * The default context value.
 *
 * A separate `LoadingContext` is created with `null` as the default so
 * that we can detect consumers that are used outside of a `LoadingProvider`.
 */
const LoadingContext = createContext<LoadingContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export interface LoadingProviderProps {
  children: React.ReactNode;
  /** Minimum time (ms) the loading screen should be visible. */
  minDisplayTimeMs?: number;
  /** Duration (ms) of the fade-out transition. */
  fadeOutDurationMs?: number;
}

export function LoadingProvider({
  children,
  minDisplayTimeMs = minDisplayTime,
  fadeOutDurationMs = fadeOutDuration,
}: LoadingProviderProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [isVisible, setIsVisible] = useState(true);

  // Track when loading started so we can enforce the minimum display time.
  const [startTime, setStartTime] = useState<number | null>(null);

  // Record the start time on mount (client-side only).
  useEffect(() => {
    if (isBrowser()) {
      setStartTime(Date.now());
    }
  }, []);

  // Mark the application as loaded.
  // Respects the minimum display time before transitioning to "loaded".
  const markAsLoaded = useCallback(() => {
    if (!isBrowser() || startTime === null) {
      setLoadingState("loaded");
      return;
    }

    const elapsed = Date.now() - startTime;
    const remaining = minDisplayTimeMs - elapsed;

    if (remaining > 0) {
      // Wait for the remaining minimum display time before marking as loaded.
      const timer = setTimeout(() => {
        setLoadingState("loaded");
      }, remaining);
      return () => clearTimeout(timer);
    } else {
      setLoadingState("loaded");
    }
  }, [startTime, minDisplayTimeMs]);

  // Once the state is "loaded", begin the fade-out sequence.
  useEffect(() => {
    if (loadingState === "loaded" && isBrowser()) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, fadeOutDurationMs);
      return () => clearTimeout(timer);
    }
  }, [loadingState, fadeOutDurationMs]);

  // Expose `isLoading` as a convenience boolean.
  const isLoading = useMemo(() => loadingState !== "loaded", [loadingState]);

  const value = useMemo<LoadingContextValue>(
    () => ({
      isLoading,
      loadingState,
      markAsLoaded,
    }),
    [isLoading, loadingState, markAsLoaded]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export { LoadingContext };
