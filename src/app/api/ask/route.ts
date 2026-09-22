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
 *
 * Which means this is normally called cross-origin: the page is on GitHub
 * Pages and the endpoint is not, so it answers CORS preflight and echoes an
 * allowed origin. Allowed, not open — an endpoint that spends a key on
 * anyone's page is a bill waiting to happen.
 */

import { NextResponse } from "next/server";
import { ask, MAX_QUESTION } from "@/lib/ask";

export const runtime = "nodejs";
/** Never cached: the key lives here and every request is a fresh question. */
export const dynamic = "force-dynamic";

/**
 * Origins allowed to call this.
 *
 * The published site and local development by default; `ASK_ALLOWED_ORIGINS`
 * (comma-separated) replaces the list when the site moves. A request with no
 * Origin header — curl, a health check — is not a browser and is left alone;
 * the rate limit is what bounds those.
 */
const ALLOWED_ORIGINS: readonly string[] = (
  process.env.ASK_ALLOWED_ORIGINS ??
  "https://abdoahmed666.github.io,http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * CORS headers for one request.
 *
 * `Vary: Origin` is not decoration: without it a CDN can hand one origin's
 * allow-header to another and the endpoint either breaks or leaks.
 */
function cors(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = { vary: "Origin" };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "POST, OPTIONS";
    headers["access-control-allow-headers"] = "content-type";
    headers["access-control-max-age"] = "86400";
  }

  return headers;
}

/** Preflight. Browsers send this before the POST whenever it is cross-origin. */
export function OPTIONS(request: Request): NextResponse {
  return new NextResponse(null, { status: 204, headers: cors(request) });
}

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
  const response = await answer(request);

  // Attached in one place rather than at each return: a 429 or a 500 that
  // silently lacks them reads in the browser as a network failure, and the
  // next return added below would have to remember on its own.
  for (const [key, value] of Object.entries(cors(request))) {
    response.headers.set(key, value);
  }

  return response;
}

/** The request itself: validate, rate limit, answer. */
async function answer(request: Request): Promise<NextResponse> {
  // CORS only makes the browser throw the response away — the work is
  // already done and the key already spent by then. An Origin this endpoint
  // does not serve is refused before any of that. It stops another page
  // embedding this box on someone else's bill; a script sending no Origin
  // at all is a different problem, and the rate limit is what bounds it.
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: "This endpoint does not answer for that origin." },
      { status: 403 }
    );
  }

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
