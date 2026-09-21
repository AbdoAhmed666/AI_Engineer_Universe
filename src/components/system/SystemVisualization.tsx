/**
 * System visualization.
 *
 * Decides whether the 3D scene is allowed to run, and keeps the 2D schematic
 * as the thing that is always there. The schematic is passed in as children
 * from the server, so it stays a server component and stays in the HTML —
 * this wrapper only decides what is drawn on top of it.
 *
 * The canvas mounts only when every condition holds: hydration has happened,
 * the band is on screen, the viewport is wide enough for a horizontal rail,
 * motion is allowed, WebGL2 is available, the device has cores to spare, and
 * the connection is not in data-saver mode.
 *
 * Mounting and running are two different questions, and this owns both. Once
 * mounted the canvas stays mounted, so scrolling past and back does not
 * refetch the chunk or rebuild the scene; but FLOW only runs while the band
 * is actually on screen and the tab is actually in front, so a scene nobody
 * is looking at costs nothing. Any failure — including the scene
 * chunk failing to load or the GL context being lost — leaves the schematic
 * exactly as it was, because the schematic is a finished artifact rather than
 * a placeholder.
 *
 * `three` and `@react-three/fiber` are reached only through `next/dynamic`
 * with `ssr: false`, which is why this file carries `"use client"`: that
 * option is only honoured inside a Client Component.
 *
 * @example
 * <SystemVisualization>
 *   <SystemSchematic />
 * </SystemVisualization>
 */

"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const SignalPathScene = dynamic(() => import("./scene/SignalPathScene"), {
  ssr: false,
});

/**
 * Props for the {@link SystemVisualization} component.
 */
export interface SystemVisualizationProps {
  /** The 2D schematic, rendered on the server. */
  children: ReactNode;
  className?: string;
}

/** Minimum viewport width for the 3D rail, matching Tailwind's `lg`. */
const MIN_WIDTH = 1024;

/** Minimum logical cores before the scene is considered affordable. */
const MIN_CORES = 4;

/** How far outside the viewport the band still counts as worth mounting. */
const MARGIN = 200;

/** Whether this device and session should render the scene at all. */
function isCapable(): boolean {
  if (typeof window === "undefined") return false;
  if (window.innerWidth < MIN_WIDTH) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  const cores = navigator.hardwareConcurrency;
  if (typeof cores === "number" && cores < MIN_CORES) return false;

  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  if (connection?.saveData) return false;

  try {
    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2")) return false;
  } catch {
    return false;
  }

  return true;
}

/**
 * Renders the schematic, and the 3D scene over it where it is supported.
 *
 * @param props - The schematic as children, plus optional class name.
 * @returns The visualization container.
 */
export function SystemVisualization({
  children,
  className,
}: SystemVisualizationProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [foreground, setForeground] = useState(true);
  const [ready, setReady] = useState(false);
  const [frame, setFrame] = useState<{ top: number; height: number } | null>(
    null
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || !isCapable()) return;

    // Near enough to matter already: mount straight away rather than waiting
    // on an observer callback. This is the common case on a desktop first
    // paint, and it keeps the mount off the observer's critical path.
    const box = element.getBoundingClientRect();
    if (box.top < window.innerHeight + MARGIN && box.bottom > -MARGIN) {
      setMounted(true);
      setOnScreen(true);
    }

    // Nothing to fall back to, and nothing that needs one: `isCapable`
    // already requires WebGL2, and no engine ships that without an
    // IntersectionObserver. If the band was near enough the fold the check
    // above has already mounted it.
    if (typeof IntersectionObserver === "undefined") return;

    // The observer is kept for the life of the component rather than
    // disconnected on first sight: mounting happens once, but FLOW needs to
    // know every time the band arrives and leaves.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        setOnScreen(visible);
        if (visible) setMounted(true);
      },
      { rootMargin: `${MARGIN}px 0px` }
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // A backgrounded tab throttles its frames rather than stopping them, so
  // the loop is stood down explicitly instead of left to the browser.
  useEffect(() => {
    const onChange = () =>
      setForeground(document.visibilityState === "visible");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  // A lost context takes the scene away and gives the schematic back.
  useEffect(() => {
    if (!ready) return;
    const canvas = ref.current?.querySelector("canvas");
    if (!canvas) return;
    const onLost = () => {
      setReady(false);
      setMounted(false);
    };
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [ready]);

  const onSceneReady = useCallback(() => setReady(true), []);

  // The canvas replaces the *drawing*, not the whole figure: the caption
  // above it is real copy and has to stay. `[data-boot-anchor]` marks the
  // drawing, and the overlay is sized to exactly that box.
  useEffect(() => {
    const container = ref.current;
    if (!container || !mounted) return;
    const anchor = container.querySelector<HTMLElement>("[data-boot-anchor]");
    if (!anchor) return;

    const measure = () => {
      setFrame({ top: anchor.offsetTop, height: anchor.offsetHeight });
    };
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [mounted]);

  return (
    <div
      ref={ref}
      className={cn("relative", ready && "scene-ready", className)}
    >
      {/*
        The schematic never leaves the DOM: it carries the screen-reader
        description of the pipeline, and it is what remains if the scene
        never arrives. Only its drawing fades, and only once the scene has
        actually rendered a frame.
      */}
      {children}

      {mounted && frame && (
        /*
          Not `aria-hidden`: the scene carries the only interactive elements
          on the band — a button per stage — and focusable content inside a
          hidden subtree is unreachable by exactly the people the markup is
          for. The scene marks its own canvas and its decorative labels
          hidden instead, so what is exposed here is the stage buttons and
          nothing else. `pointer-events-none` stays, and the buttons opt
          back in, so the overlay never swallows a click meant for the page.
        */
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 opacity-0 transition-opacity duration-500",
            ready && "opacity-100"
          )}
          style={{ top: frame.top, height: frame.height }}
        >
          <SignalPathScene
            onReady={onSceneReady}
            active={ready && onScreen && foreground}
          />
        </div>
      )}
    </div>
  );
}

export default SystemVisualization;
