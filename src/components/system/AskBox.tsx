"use client";

/**
 * The ask box.
 *
 * The one place on this site a visitor can run something rather than read
 * it. A question goes to `/api/ask`, which retrieves from the corpus built
 * out of the same three project definitions the rest of the page is drawn
 * from, and answers only from what it found.
 *
 * That constraint is the point, and it is visible: every answer carries
 * the claims behind it, and a question the site makes no claim about comes
 * back declined rather than answered. It is the page's first principle —
 * if it cannot be traced to real project data, it should not be drawn —
 * applied to a sentence instead of a shape.
 *
 * No new motion vocabulary. The pending state reuses FLOW, the same
 * animation the schematic and the scene use for signal in transit, because
 * that is exactly what it is showing.
 *
 * @example
 * <AskBox />
 */

import { useCallback, useId, useRef, useState } from "react";
import { CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** One claim the answer was allowed to use. */
interface Source {
  readonly label: string;
  readonly href: string;
  readonly text: string;
}

/** What the endpoint returns on success. */
interface Answer {
  readonly text: string;
  readonly sources: readonly Source[];
  readonly declined: boolean;
}

/**
 * Where to send the question.
 *
 * The site is a static export and a static host cannot hold an API key, so
 * the endpoint is configurable: the static build points at whichever
 * deployment serves the route, and a local `next dev` falls back to its own.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_ASK_ENDPOINT ?? "/api/ask";

/** Matches the limit the route enforces, so the UI can say so first. */
const MAX_QUESTION = 300;

/**
 * Openers.
 *
 * An empty box is the reason most of these get closed unread, and these
 * are picked to show the range rather than to flatter: the third has a
 * measured number behind it, and the fourth is one the corpus cannot
 * answer, so a visitor can watch it decline.
 */
const SUGGESTIONS = [
  "How does the interview agent decide what to ask next?",
  "What does he use for retrieval, and why?",
  "How is the gesture system actually deployed?",
  "Does he know Kubernetes?",
  // Arabic is supported and nobody would guess it, so one opener says so.
  "إيه مشروع التخرج بتاعه؟",
] as const;

/**
 * Splits a claim into its subject and the rest.
 *
 * Every document leads with the thing it is about, because a chunk is
 * retrieved alone and "it uses FAISS" is useless without a subject. In the
 * source list that subject is already a link, so it is not printed twice.
 *
 * Two shapes exist in the corpus and they read differently: `"X: a, b, c"`
 * is a list, which takes a dash, and `"X is deployed on Docker."` is a
 * sentence, which does not.
 */
function splitClaim(
  text: string,
  label: string
): { readonly rest: string; readonly sentence: boolean } {
  const head = label.split(" · ")[0];
  if (!text.toLowerCase().startsWith(head.toLowerCase())) {
    return { rest: text, sentence: false };
  }

  const after = text.slice(head.length);
  return after.startsWith(":")
    ? { rest: after.slice(1).trim(), sentence: false }
    : { rest: after.trim(), sentence: true };
}

/** Which claim numbers the answer actually cited. */
function citedIn(text: string): ReadonlySet<number> {
  return new Set(
    Array.from(text.matchAll(/\[(\d+)\]/g), (m) => Number(m[1]))
  );
}

/** Request state, as a single value rather than three booleans. */
type Status = "idle" | "pending" | "answered" | "error";

export interface AskBoxProps {
  className?: string;
}

/**
 * Splits an answer on its inline `[n]` markers.
 *
 * The model is told to cite as `[1]`, so the numbers are rendered as links
 * into the source list rather than left as literal brackets. A marker
 * pointing past the end of the list is left as text — a wrong citation
 * should look wrong, not resolve to whatever happens to be last.
 */
function withCitations(
  text: string,
  sources: readonly Source[],
  listId: string
): React.ReactNode[] {
  return text.split(/(\[\d+\])/g).map((part, index) => {
    const match = /^\[(\d+)\]$/.exec(part);
    const number = match ? Number(match[1]) : 0;

    if (!number || number > sources.length) {
      return <span key={index}>{part}</span>;
    }

    return (
      <a
        key={index}
        href={`#${listId}-${number}`}
        className="ml-0.5 rounded-sm bg-accent-soft px-1 align-super font-mono text-[0.65em] text-accent transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
      >
        {number}
      </a>
    );
  });
}

/**
 * Grounded question box over the site's own corpus.
 *
 * @param props - Optional extra classes.
 * @returns The rendered ask box.
 */
export function AskBox({ className }: AskBoxProps): React.ReactElement {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  /** Lets a late response from an abandoned question be dropped. */
  const requestId = useRef(0);

  const baseId = useId();
  const inputId = `${baseId}-q`;
  const hintId = `${baseId}-hint`;
  const outputId = `${baseId}-out`;
  const listId = `${baseId}-src`;

  const submit = useCallback(async (asked: string) => {
    const trimmed = asked.trim();
    if (trimmed.length < 3 || trimmed.length > MAX_QUESTION) return;

    const id = ++requestId.current;
    setStatus("pending");
    setError(null);

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      // A static export with no endpoint configured lands here as an HTML
      // 404, so the body is read defensively rather than assumed to be JSON.
      const payload: unknown = await response.json().catch(() => null);

      if (id !== requestId.current) return;

      if (!response.ok || payload === null) {
        const message =
          payload && typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "The answering service isn't reachable right now.";
        setError(message);
        setStatus("error");
        return;
      }

      setAnswer(payload as Answer);
      setStatus("answered");
    } catch {
      if (id !== requestId.current) return;
      setError("The answering service isn't reachable right now.");
      setStatus("error");
    }
  }, []);

  const pending = status === "pending";
  const cited = answer ? citedIn(answer.text) : new Set<number>();

  return (
    <div className={cn("max-w-[72ch]", className)}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(question);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Ask a question about this work
        </label>

        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border bg-surface px-4 transition-colors duration-200",
            "border-line focus-within:border-line-strong",
            pending && "border-line-strong"
          )}
        >
          <span
            aria-hidden="true"
            className="font-mono text-small text-accent select-none"
          >
            ?
          </span>

          <input
            ref={inputRef}
            id={inputId}
            type="text"
            // Arabic typed here should lay out right-to-left; English left.
            dir="auto"
            value={question}
            maxLength={MAX_QUESTION}
            disabled={pending}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about the architecture, the retrieval, the deployment…"
            aria-describedby={hintId}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-4 text-body text-foreground placeholder:text-faint focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={pending || question.trim().length < 3}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 font-mono text-label uppercase transition-colors duration-200",
              "bg-accent-soft text-accent hover:bg-accent hover:text-accent-foreground",
              "disabled:pointer-events-none disabled:opacity-40",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            )}
          >
            {pending ? "…" : "Ask"}
            {!pending && <CornerDownLeft size={13} aria-hidden="true" />}
          </button>
        </div>

        {/*
         * FLOW, and only while a question is in flight. The line is the
         * request: it is drawn when there is signal to draw and removed
         * from the DOM when there is not, so nothing animates at rest.
         */}
        <div className="h-px overflow-hidden bg-line" aria-hidden="true">
          {pending && (
            <div
              className="motion-flow-x h-px w-1/3 bg-accent"
              style={
                {
                  // The band is a third of the track, so a full traverse is
                  // two track-widths of its own size.
                  "--flow-distance": "200%",
                  "--motion-flow": "1100ms",
                } as React.CSSProperties
              }
            />
          )}
        </div>

        <p id={hintId} className="mt-3 text-small text-faint">
          Answers come only from what this site documents — three projects,
          their layers and their deployments. Anything outside that, it says
          it doesn&apos;t know.
        </p>
      </form>

      {status === "idle" && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => {
                  setQuestion(suggestion);
                  inputRef.current?.focus();
                  void submit(suggestion);
                }}
                dir="auto"
                className="rounded-full border border-line px-3 py-1.5 text-small text-muted-foreground transition-colors duration-200 hover:border-line-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div id={outputId} aria-live="polite" className="mt-6 empty:mt-0">
        {status === "error" && error && (
          <p className="rounded-lg border border-line bg-surface p-5 text-body text-muted-foreground">
            {error}
          </p>
        )}

        {status === "answered" && answer && (
          <div className="rounded-lg border border-line bg-surface p-6">
            {/* An Arabic answer has to lay itself out right-to-left. */}
            <p dir="auto" className="text-body text-foreground">
              {withCitations(answer.text, answer.sources, listId)}
            </p>

            {answer.sources.length > 0 && (
              <>
                <p className="mt-6 mb-3 font-mono text-label uppercase text-faint">
                  Retrieved · {answer.sources.length} claims · {cited.size} cited
                </p>
                {/*
                 * Every claim the model was given, not only the ones it
                 * used. Showing the whole context is the part that can be
                 * checked: a visitor can see what it had to work with, and
                 * an answer citing one of six is a retrieval result worth
                 * seeing rather than one worth hiding.
                 */}
                <ol className="space-y-2 border-t border-line pt-3">
                  {answer.sources.map((source, index) => {
                    const used = cited.has(index + 1);
                    const claim = splitClaim(source.text, source.label);
                    return (
                      <li
                        key={`${source.label}-${index}`}
                        id={`${listId}-${index + 1}`}
                        className="flex gap-3 text-small"
                      >
                        <span
                          className={cn(
                            "shrink-0 font-mono",
                            used ? "text-accent" : "text-faint"
                          )}
                        >
                          {index + 1}
                        </span>
                        {/*
                          * Clamped: a project overview is a full paragraph,
                          * and six of them would bury the answer they are
                          * meant to support. The whole claim is in the
                          * title, and the link goes to it on the page.
                          */}
                        <span
                          title={source.text}
                          className={cn(
                            "line-clamp-3",
                            !used && "opacity-55"
                          )}
                        >
                          <a
                            href={source.href}
                            className="text-foreground underline decoration-line underline-offset-4 transition-colors duration-200 hover:decoration-accent"
                          >
                            {source.label}
                          </a>
                          <span className="text-muted-foreground">
                            {claim.sentence ? " " : " — "}
                            {claim.rest}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}

            {answer.declined && (
              <p className="mt-4 font-mono text-label uppercase text-faint">
                Nothing retrieved · no model was called
              </p>
            )}
          </div>
        )}
      </div>

      {status !== "idle" && !pending && (
        <button
          type="button"
          onClick={() => {
            requestId.current += 1;
            setQuestion("");
            setAnswer(null);
            setError(null);
            setStatus("idle");
            inputRef.current?.focus();
          }}
          className="mt-4 font-mono text-label uppercase text-faint transition-colors duration-200 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Ask another
        </button>
      )}
    </div>
  );
}
