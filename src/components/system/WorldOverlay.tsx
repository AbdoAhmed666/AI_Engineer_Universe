/**
 * World overlay.
 *
 * The full-screen shell the project city lives in. It owns everything about
 * being a temporary destination — opening, closing, Escape, locking the page
 * behind it, returning focus — and nothing about what is drawn inside.
 *
 * The city is an enhancement, never the only way to see the work: the project
 * cards in the Projects section carry the same content, and the trigger is
 * simply not rendered on a device that cannot run the scene. Nothing in the
 * page depends on this having opened.
 *
 * `three` is reached only through `next/dynamic` with `ssr: false`, so the
 * renderer is fetched when someone actually opens the world and never before.
 *
 * The overlay is portalled to `document.body` rather than rendered in place.
 * The trigger sits inside the Hero's entrance animation, and a transformed
 * ancestor becomes the containing block for `position: fixed` — without the
 * portal the "full screen" dialog is the size of the button row.
 *
 * @example
 * <WorldOverlay />
 */

"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/utils";

const CityScene = dynamic(() => import("./scene/CityScene"), { ssr: false });

/**
 * Capability is a property of the device, not of React state: it is read
 * once and never changes for the life of the page. `useSyncExternalStore`
 * expresses exactly that — a server snapshot of `false` so the markup
 * matches, and a cached client snapshot afterwards — without an effect that
 * sets state during the first commit.
 */
let capabilityCache: boolean | null = null;

/** Never emits: the answer cannot change. */
const subscribeToNothing = () => () => {};

/** Server render: the world is never offered in the HTML. */
const notOffered = () => false;

/**
 * Props for the {@link WorldOverlay} component.
 */
export interface WorldOverlayProps {
  /** Label for the trigger. */
  label?: string;
  className?: string;
}

/** Minimum viewport width before the world is offered at all. */
const MIN_WIDTH = 900;

/** Minimum logical cores before the scene is considered affordable. */
const MIN_CORES = 4;

/** Whether this device should be offered the world. */
function isCapable(): boolean {
  if (typeof window === "undefined") return false;
  if (window.innerWidth < MIN_WIDTH) return false;

  const cores = navigator.hardwareConcurrency;
  if (typeof cores === "number" && cores < MIN_CORES) return false;

  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  if (connection?.saveData) return false;

  try {
    if (!document.createElement("canvas").getContext("webgl2")) return false;
  } catch {
    return false;
  }

  return true;
}

/**
 * A button that opens the project city full screen.
 *
 * @param props - Trigger label and optional class name.
 * @returns The trigger, and the overlay while it is open.
 */
export function WorldOverlay({
  label = "Enter the world",
  className,
}: WorldOverlayProps): React.ReactElement | null {
  const offered = useSyncExternalStore(
    subscribeToNothing,
    () => {
      if (capabilityCache === null) capabilityCache = isCapable();
      return capabilityCache;
    },
    notOffered
  );
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setReady(false);
    triggerRef.current?.focus();
  }, []);

  /**
   * While the world is open: Escape closes it, the page behind cannot
   * scroll away underneath, and neither the keyboard nor a screen reader
   * can wander out into it.
   *
   * The world holds real controls now — a button per building — so a
   * dialog that merely looked modal is no longer good enough. Everything
   * else at body level is marked `inert`, which takes it out of the
   * tab order and out of the accessibility tree in one move, and Tab is
   * wrapped at both ends so focus cycles inside the dialog rather than
   * escaping into browser chrome.
   */
  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;

    /** Everything focusable inside the dialog, in tab order. */
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const stops = focusable();
      if (stops.length === 0) return;

      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // The portal is a child of body, so the page behind is the rest of
    // body's children. Anything already inert is left alone, and only what
    // this opened is put back.
    const silenced: HTMLElement[] = [];
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (child === dialog || child.contains(dialog)) continue;
      if (child.hasAttribute("inert")) continue;
      child.setAttribute("inert", "");
      silenced.push(child);
    }

    closeRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
      for (const element of silenced) element.removeAttribute("inert");
    };
  }, [open, close]);

  if (!offered) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group relative flex w-full items-center justify-between gap-6 overflow-hidden",
          "rounded-lg border border-accent/40 bg-accent-soft px-6 py-5 text-left",
          "transition-colors duration-200 hover:border-accent sm:w-auto",
          className
        )}
      >
        <span>
          <span className="eyebrow block text-accent">3D · Interactive</span>
          <span className="mt-1 block text-h3 text-foreground">{label}</span>
          <span className="mt-1 block text-small text-muted-foreground">
            Walk the project city — every building generated from its
            architecture
          </span>
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 font-mono text-h3 text-accent transition-transform duration-200 group-hover:translate-x-1"
        >
          ⤢
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-[1200] bg-background"
          >
            <CityScene onReady={() => setReady(true)} />

            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 id={titleId} className="eyebrow">
                    Project city
                  </h2>
                  <p className="mt-1 max-w-[46ch] text-small text-muted-foreground">
                    Every building is generated from what its project documents
                    — floors are architectural layers, and a floor is as wide as
                    the number of parts in it.
                  </p>
                </div>

                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  className="pointer-events-auto inline-flex h-10 items-center gap-2 rounded-md border border-line-strong px-4 font-mono text-small text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  Close
                  <span aria-hidden="true">✕</span>
                </button>
              </div>

              <p className="eyebrow">
                {ready
                  ? "Drag to orbit · Scroll to zoom · Esc to exit"
                  : "Loading…"}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default WorldOverlay;
