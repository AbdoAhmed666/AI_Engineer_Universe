/**
 * The ask endpoint.
 *
 * Everything the site can be asked goes through here: validate, rate
 * limit, answer. It is the only part of this project that needs a server,
 * which is why the rest of the site remains a static export and this is
 * the single thing a static host cannot carry.
 *
 * Deliberately not exported statically — see `next.config.ts`, which drops
 * this route from the export build. The client then calls whichever
 * deployment does serve it, via NEXT_PUBLIC_ASK_ENDPOINT.
 */

import { NextResponse } from "next/server";
import { ask, MAX_QUESTION } from "@/lib/ask";

export const runtime = "nodejs";
/** Never cached: the key lives here and every request is a fresh question. */
export const dynamic = "force-dynamic";

/** Requests allowed per address, and over what window. */
const LIMIT = { requests: 8, windowMs: 60_000 } as const;

/** Longest a provider may take before the visitor gets an error instead. */
const TIMEOUT_MS = 20_000;

/**
 * Per-address request times.
 *
 * In memory, which on a serverless host means per instance — so this slows
 * abuse rather than stopping it. It is here because it costs nothing and
 * catches the realistic case, a script hammering one endpoint. Anything
 * stronger needs shared state, which is not worth a dependency until this
 * is actually being abused.
 */
const seen = new Map<string, number[]>();

function rateLimited(address: string): boolean {
  const now = Date.now();
  const recent = (seen.get(address) ?? []).filter(
    (at) => now - at < LIMIT.windowMs
  );
  recent.push(now);
  seen.set(address, recent);

  // Keep the map from growing without bound on a long-lived instance.
  if (seen.size > 5000) {
    for (const [key, times] of seen) {
      if (times.every((at) => now - at >= LIMIT.windowMs)) seen.delete(key);
    }
  }

  return recent.length > LIMIT.requests;
}

export async function POST(request: Request): Promise<NextResponse> {
  const address =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (rateLimited(address)) {
    return NextResponse.json(
      { error: "Too many questions in a short time. Try again in a minute." },
      { status: 429 }
    );
  }

  let question: unknown;
  try {
    question = (await request.json())?.question;
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  if (typeof question !== "string" || question.trim().length < 3) {
    return NextResponse.json(
      { error: "Ask a question." },
      { status: 400 }
    );
  }
  if (question.length > MAX_QUESTION) {
    return NextResponse.json(
      { error: `Questions are limited to ${MAX_QUESTION} characters.` },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const answer = await ask(question.trim(), controller.signal);
    return NextResponse.json(answer);
  } catch (error) {
    // Logged in full, returned in outline: the message can carry the
    // provider's own error text, and that is not the visitor's business.
    console.error("[ask]", error);
    const aborted = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        error: aborted
          ? "That took too long. Try again."
          : "Something went wrong answering that.",
      },
      { status: aborted ? 504 : 500 }
    );
  } finally {
    clearTimeout(timer);
  }
}
