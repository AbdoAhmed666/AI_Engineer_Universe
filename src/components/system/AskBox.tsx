"use client";

/**
 * The ask box.
 *
 * The one place on this site a visitor can run something rather than read
 * it. A question is matched against a corpus built out of the same three
 * project definitions the diagram and the city are drawn from, and what
 * comes back is the claims themselves — the site's own sentences, each
 * linked to where it is made.
 *
 * There is no language model here, and that is the design rather than a
 * compromise. A model would write a nicer paragraph and would also be the
 * only part of this page capable of saying something the data does not
 * support. Returning the matched claims cannot invent one: the governing
 * rule of this project is that nothing is drawn unless it can be traced to
 * real project data, and this is that rule with no exception carved into
 * it.
 *
 * It runs entirely in the browser. No endpoint, no key, no cost, nothing
 * to rate limit, and it works on a static host with no server at all. The
 * retriever is loaded on first use rather than up front, so the page's
 * initial JavaScript is unchanged for visitors who never touch it.
 *
 * @example
 * <AskBox />
 */

import { useCallback, useId, useRef, useState } from "react";
import { CornerDownLeft } from "lucide-react";
import type { Hit } from "@/lib/retrieval";
import { cn } from "@/lib/utils";

/** Longest question accepted. Past this it is a paragraph, not a question. */
const MAX_QUESTION = 300;

/** How many claims to show. */
const RESULTS = 5;

/**
 * Openers.
 *
 * An empty box is why most of these go unused, and these are chosen to
 * show the range rather than to flatter: one has a measured number behind
 * it, one is in Arabic because nobody would guess that works, and one is a
 * question the site cannot answer, so a visitor can watch it say so.
 */
const SUGGESTIONS = [
  "How does the interview agent decide what to ask next?",
  "What does he use for retrieval, and why?",
  "How is the gesture system actually deployed?",
  "Does he know Kubernetes?",
  "إيه مشروع التخرج بتاعه؟",
] as const;

/** What a search produced, including the two ways of finding nothing. */
interface Result {
  readonly query: string;
  readonly hits: readonly Hit[];
  /** True when the question left no term the index could be searched on. */
  readonly unsearchable: boolean;
}

type Status = "idle" | "searching" | "done";

export interface AskBoxProps {
  className?: string;
}

/**
 * Marks the terms a claim was actually matched on.
 *
 * The point is not decoration. For an Arabic question the highlight lands
 * on the English word the alias table produced, which is the mechanism
 * made visible: the visitor typed "دوكر" and can see it matched "docker".
 */
function highlight(text: string, matched: readonly string[]): React.ReactNode {
  if (matched.length === 0) return text;

  // Longest first, so "postgresql" is not half-matched by "post".
  const terms = [...matched]
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const pattern = new RegExp(`(${terms.join("|")})`, "gi");

  return text.split(pattern).map((part, index) =>
    matched.some((term) => term.toLowerCase() === part.toLowerCase()) ? (
      <mark
        key={index}
        className="rounded-sm bg-accent-soft px-0.5 font-medium text-accent"
      >
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  );
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
  const [result, setResult] = useState<Result | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const baseId = useId();
  const inputId = `${baseId}-q`;
  const hintId = `${baseId}-hint`;

  const search = useCallback(async (asked: string) => {
    const trimmed = asked.trim();
    if (trimmed.length < 2 || trimmed.length > MAX_QUESTION) return;

    setStatus("searching");

    /*
     * Loaded here rather than imported at the top: the corpus and the
     * index are a few kilobytes that a visitor who never asks anything
     * should not pay for. The module caches its own index, so this is a
     * cost paid once per session.
     */
    const { retrieve, hasSearchableTerms } = await import("@/lib/retrieval");

    setResult({
      query: trimmed,
      hits: retrieve(trimmed, RESULTS),
      unsearchable: !hasSearchableTerms(trimmed),
    });
    setStatus("done");
  }, []);

  const reset = useCallback(() => {
    setQuestion("");
    setResult(null);
    setStatus("idle");
    inputRef.current?.focus();
  }, []);

  const searching = status === "searching";

  return (
    <div className={cn("max-w-[72ch]", className)}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void search(question);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Ask a question about this work
        </label>

        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 transition-colors duration-200 focus-within:border-line-strong">
          <span
            aria-hidden="true"
            className="select-none font-mono text-small text-accent"
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
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about the architecture, the retrieval, the deployment…"
            aria-describedby={hintId}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-4 text-body text-foreground placeholder:text-faint focus:outline-none"
          />

          <button
            type="submit"
            disabled={searching || question.trim().length < 2}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 font-mono text-label uppercase transition-colors duration-200",
              "bg-accent-soft text-accent hover:bg-accent hover:text-accent-foreground",
              "disabled:pointer-events-none disabled:opacity-40",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            )}
          >
            Ask
            <CornerDownLeft size={13} aria-hidden="true" />
          </button>
        </div>

        <p id={hintId} className="mt-3 text-small text-faint">
          BM25 over this site&apos;s own claims, running in your browser — no
          server, no model, nothing sent anywhere. It returns the sentences
          the site actually makes, so it cannot invent one.
        </p>
      </form>

      {status === "idle" && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                dir="auto"
                onClick={() => {
                  setQuestion(suggestion);
                  void search(suggestion);
                }}
                className="rounded-full border border-line px-3 py-1.5 text-small text-muted-foreground transition-colors duration-200 hover:border-line-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div aria-live="polite" className="mt-6 empty:mt-0">
        {status === "done" && result && (
          <div className="rounded-lg border border-line bg-surface p-6">
            {result.hits.length > 0 ? (
              <>
                <p className="mb-4 font-mono text-label uppercase text-faint">
                  {result.hits.length}{" "}
                  {result.hits.length === 1 ? "claim" : "claims"} · ranked by
                  BM25
                </p>

                <ol className="space-y-4">
                  {result.hits.map((hit, index) => (
                    <li key={hit.doc.id} className="flex gap-3 text-small">
                      <span className="shrink-0 font-mono text-accent">
                        {index + 1}
                      </span>
                      <span>
                        <span className="text-foreground">
                          {highlight(hit.doc.text, hit.matched)}
                        </span>{" "}
                        <a
                          href={hit.doc.cite.href}
                          className="whitespace-nowrap font-mono text-label uppercase text-faint underline decoration-line underline-offset-4 transition-colors duration-200 hover:text-accent hover:decoration-accent"
                        >
                          {hit.doc.cite.kind} ↗
                        </a>
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              /*
               * Two different facts, told apart rather than collapsed. The
               * site making no such claim, and the question never reaching
               * the index, are not the same thing, and reporting the first
               * when the second happened is the one kind of lie this whole
               * design exists to prevent.
               */
              <p dir="auto" className="text-body text-muted-foreground">
                {result.unsearchable
                  ? "Nothing in that question reached the index, which is English. Keep the technical term in English — “هو يعرف Docker؟” works — and it will find it."
                  : "This site documents nothing about that. Everything here comes from three projects: the AI Interview Agent, the AI Internal Knowledge Assistant, and a real-time gesture smart-home system."}
              </p>
            )}
          </div>
        )}
      </div>

      {status === "done" && (
        <button
          type="button"
          onClick={reset}
          className="mt-4 font-mono text-label uppercase text-faint transition-colors duration-200 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Ask another
        </button>
      )}
    </div>
  );
}
