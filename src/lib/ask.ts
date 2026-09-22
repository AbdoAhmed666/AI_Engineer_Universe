/**
 * Answering a question from the corpus.
 *
 * Retrieval is local and already measured; this is the part that turns the
 * retrieved claims into a sentence. The model is given the claims and told
 * it may use nothing else, which is the same rule the rest of the site is
 * built on — an answer with no source is not drawn.
 *
 * Provider-agnostic on purpose: the request is the OpenAI chat-completions
 * shape, which Groq, Together and OpenAI itself all speak, so moving
 * between them is two environment variables. Nothing here imports a
 * vendor SDK.
 */

import { hasArabic } from "./arabic";
import { hasSearchableTerms, retrieve, type Hit } from "./retrieval";

/** What the caller gets back. */
export interface Answer {
  readonly text: string;
  /** The claims the answer was allowed to use, in the order given. */
  readonly sources: readonly { label: string; href: string; text: string }[];
  /** True when the corpus had nothing and no model was called. */
  readonly declined: boolean;
}

/** How many claims the model is given. */
const CONTEXT_SIZE = 6;

/** Longest question accepted, in characters. */
export const MAX_QUESTION = 300;

const SYSTEM = `You answer questions about Abdelrhman Ahmed, an AI engineer, for visitors to his portfolio.

Rules, in order of importance:
1. Use ONLY the numbered claims provided. They are the entire truth you have.
2. If the claims do not answer the question, say so plainly in one sentence. Never guess, never fill a gap with what is typical for an AI engineer, and never soften a "no" into a maybe.
3. Cite the claims you used as [1], [2] inline.
4. Two or three sentences. No preamble, no "based on the provided context", no bullet lists.
5. Write in the third person: "He built…", not "I built…".
6. Answer in the language the question is written in. The claims are always in English; if the question is in Arabic, answer in Arabic and keep the technical terms in English — FAISS, FastAPI, Docker — because that is how engineers write them. Rules 1 and 2 do not relax for any language.`;

/** Formats the retrieved claims the way the prompt refers to them. */
function asContext(hits: readonly Hit[]): string {
  return hits
    .map((hit, index) => `[${index + 1}] ${hit.doc.text}`)
    .join("\n");
}

/** Configuration read from the environment, so no vendor is hard-coded. */
interface Provider {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly model: string;
}

/**
 * Reads the provider configuration.
 *
 * @throws If no key is set — a missing key is a deployment mistake, and
 *   failing loudly at the first request beats answering nothing forever.
 */
export function getProvider(): Provider {
  const apiKey = process.env.GROQ_API_KEY ?? process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No API key. Set GROQ_API_KEY (or LLM_API_KEY) in the environment."
    );
  }
  return {
    baseUrl:
      process.env.LLM_BASE_URL ?? "https://api.groq.com/openai/v1",
    apiKey,
    /*
     * Groq retires models, and a retired default is a deployment that
     * builds, serves and then answers every real question with a 500 —
     * which is exactly how this one was found. `llama-3.3-70b-versatile`
     * was the default and no longer exists there at all.
     *
     * Checked against the provider's own model list rather than
     * remembered. If this 404s again, that is what happened again: list
     * the models and set LLM_MODEL, no code change needed.
     */
    model: process.env.LLM_MODEL ?? "openai/gpt-oss-120b",
  };
}

/**
 * Answers a question from the corpus.
 *
 * @param question - What the visitor asked.
 * @param signal - Abort signal, so a slow provider cannot hold a request open.
 * @returns The answer and the claims behind it.
 */
export async function ask(
  question: string,
  signal?: AbortSignal
): Promise<Answer> {
  const arabic = hasArabic(question);

  // A question whose words never reached the index retrieves nothing for a
  // different reason than a question the site cannot answer, and telling
  // the visitor the wrong one is the only kind of lie this whole design
  // exists to avoid. Arabic reaches the English index through an alias
  // table, so a word missing from it lands here — that is a gap in the
  // table, not an absence in the corpus, and it says so.
  if (!hasSearchableTerms(question)) {
    return {
      text: arabic
        ? "مفيش كلمة في السؤال ده يعرف يدوّر بيها — الفهرس نفسه إنجليزي، والعربي بيوصله عن طريق قائمة كلمات، ويبان إن دي مش فيها. سيب المصطلح التقني بالإنجليزي (زي «هو يعرف Docker؟») وهيلاقيه."
        : "Nothing in that question reached the index, which is English. Ask in English — or keep the technical term in English, and it will still find it.",
      sources: [],
      declined: true,
    };
  }

  const hits = retrieve(question, CONTEXT_SIZE);

  // Nothing matched: the site makes no claim about this. Said here rather
  // than asked of the model, because it is cheaper, faster and certain.
  if (hits.length === 0) {
    return {
      text: arabic
        ? "الموقع ده مفيهوش أي كلام عن ده. كل اللي هنا مبني على تلات مشاريع — الـ AI Interview Agent، والـ AI Internal Knowledge Assistant، ونظام تحكّم في البيت بالإيماءات في الوقت الحقيقي."
        : "This site doesn't document anything about that. Everything here is drawn from three projects — the AI Interview Agent, the AI Internal Knowledge Assistant, and a real-time gesture smart-home system.",
      sources: [],
      declined: true,
    };
  }

  const { baseUrl, apiKey, model } = getProvider();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 300,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Claims:\n${asContext(hits)}\n\nQuestion: ${question}`,
        },
      ],
    }),
    signal,
  });

  if (!response.ok) {
    // Surface what the provider said. A wrong model name or an expired key
    // both land here, and both are unrecoverable without the message.
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Provider returned ${response.status}. ${detail.slice(0, 300)}`
    );
  }

  const payload: unknown = await response.json();
  const text = readContent(payload);
  if (!text) {
    throw new Error("Provider returned a response with no message content.");
  }

  return {
    text,
    sources: hits.map((hit) => ({
      label: hit.doc.cite.label,
      href: hit.doc.cite.href,
      text: hit.doc.text,
    })),
    declined: false,
  };
}

/**
 * Pulls the message out of a chat-completions response.
 *
 * Written as a narrow check rather than a cast: this is the one place an
 * unverified third-party shape enters the system, and a silent `undefined`
 * here would surface as an empty answer box with no explanation.
 */
function readContent(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const message = (choices[0] as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" && content.trim() ? content.trim() : null;
}
