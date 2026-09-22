/**
 * Retrieval over the corpus.
 *
 * BM25 — lexical, deterministic, and entirely local. That is a deliberate
 * choice rather than a shortcut, and the reasoning is worth stating because
 * the obvious move here was embeddings:
 *
 * The corpus is fifty short documents whose vocabulary is mostly proper
 * nouns — FAISS, FastAPI, BiLSTM, INT8, ESP32. Those are exactly the terms
 * a dense retriever is worst at and a lexical one is best at, and they are
 * what people actually ask about. Embeddings earn their place when a query
 * paraphrases the corpus; a recruiter typing "Docker" is not paraphrasing.
 *
 * So this is measured rather than assumed — `npm run eval:retrieval` scores
 * it against realistic questions. If a class of question starts failing,
 * that is the signal to add a dense pass, not before.
 *
 * It also means the ask box costs nothing to run, needs no key, and cannot
 * be rate limited by anyone but us.
 *
 * @example
 * import { retrieve } from "@/lib/retrieval";
 *
 * const hits = retrieve("does he know Docker?", 4);
 */

import {
  ARABIC_ALIASES,
  ARABIC_STOP,
  ARABIC_WORD,
  hasArabic,
  normalizeArabic,
} from "./arabic";
import { getCorpus, type CorpusDocument } from "./corpus";

/**
 * Query expansion.
 *
 * The eval found the only class of question this retriever fails: one
 * whose words appear nowhere in the corpus. "Making models smaller or
 * faster" is quantization; "what hardware" is an ESP32. A dense pass is
 * the usual fix, but it needs a model at query time, and the corpus
 * vocabulary here is small, closed and changes only when a project does —
 * so the failing bridges can simply be written down.
 *
 * This is honest about what it is: not semantics, a dictionary. Each entry
 * exists because a real question missed, and `npm run eval:retrieval`
 * fails if one stops working. If this list ever starts growing with every
 * new question, that is the signal the closed-vocabulary assumption has
 * broken and embeddings have earned their place.
 *
 * Expansion only adds terms; it never removes what was typed.
 */
const ALIASES: ReadonlyMap<string, readonly string[]> = new Map([
  ["smaller", ["quantization", "int8", "size", "reduction"]],
  ["faster", ["latency", "optimization", "inference"]],
  ["speed", ["latency", "optimization"]],
  ["optimize", ["quantization", "latency", "optimization"]],
  ["compress", ["quantization", "int8"]],
  ["hardware", ["esp32", "imu", "sensors", "iot", "wearable"]],
  ["device", ["esp32", "imu", "sensors", "iot"]],
  ["board", ["esp32"]],
  ["embedded", ["esp32", "imu", "iot"]],
  ["container", ["docker"]],
  ["containers", ["docker"]],
  ["deployment", ["docker", "railway", "azure", "deployed"]],
  ["database", ["postgresql", "faiss", "firebase", "index"]],
  ["postgres", ["postgresql"]],
  ["sql", ["postgresql"]],
  ["vector", ["faiss", "embeddings", "index"]],
  ["auth", ["jwt", "authentication"]],
  ["login", ["jwt", "authentication", "session"]],
  ["frontend", ["next.js", "react", "client", "interface"]],
  ["backend", ["fastapi", "service", "rest", "api"]],
  ["testing", ["evaluation", "scoring"]],
  ["evaluate", ["evaluation", "scoring", "feedback"]],
  ["team", ["led", "5-member", "lifecycle"]],
  ["lead", ["led", "5-member", "team"]],
  ["study", ["graduation", "project"]],
  ["university", ["graduation"]],
]);

/**
 * Adds corpus vocabulary implied by the question, keeping the original.
 *
 * Also adds the singular of any plural, because "what projects are there"
 * found nothing while "project" is in almost every document. Naive on
 * purpose — dropping a final "s" is wrong for a few English words and
 * right for the ones in a technical corpus, and a spurious term that
 * matches no document costs nothing, since scoring ignores it.
 */
function expand(tokens: readonly string[]): string[] {
  const out = [...tokens];
  for (const token of tokens) {
    const extra = ALIASES.get(token) ?? ARABIC_ALIASES.get(token);
    if (extra) out.push(...extra);
    if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) {
      out.push(token.slice(0, -1));
    }
  }
  return out;
}

/** Terms that could possibly match the index, which is English. */
function searchable(tokens: readonly string[]): string[] {
  return tokens.filter((token) => !hasArabic(token));
}

/**
 * Whether a question leaves anything this retriever can match on.
 *
 * The index is English and lexical. An English question always leaves
 * terms; an Arabic one leaves them only where its words are in the alias
 * table, and a question in a script nothing knows leaves none at all.
 *
 * Retrieving nothing because the site makes no such claim, and retrieving
 * nothing because the question never reached the index, are different
 * facts, and reporting the first when the second happened is the one kind
 * of lie this whole design exists to prevent. So they are told apart here
 * rather than collapsed.
 */
export function hasSearchableTerms(query: string): boolean {
  return searchable(expand(tokenize(query))).length > 0;
}

/** A document and how well it matched. */
export interface Hit {
  readonly doc: CorpusDocument;
  readonly score: number;
}

/** BM25 saturation and length-normalisation constants, at their usual values. */
const K1 = 1.4;
const B = 0.72;

/**
 * Words that carry no signal here.
 *
 * Deliberately short. Aggressive stop-word lists strip terms that matter in
 * a technical corpus, and the scoring already discounts common words.
 */
const STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "do", "does", "did", "for",
  "from", "has", "have", "he", "his", "how", "in", "is", "it", "its", "of",
  "on", "or", "that", "the", "their", "they", "this", "to", "was", "were",
  "what", "which", "who", "with", "you", "your", "i", "me", "my", "can", "any",
]);

/**
 * Lower-cases, splits on anything that is not a word character, drops noise.
 *
 * Arabic letters count as word characters and are folded to one spelling,
 * so a question typed either way produces the same token to look up.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(new RegExp(`[^a-z0-9+#.${ARABIC_WORD}]+`))
    .map((token) => token.replace(/^\.+|\.+$/g, ""))
    .map((token) => (hasArabic(token) ? normalizeArabic(token) : token))
    .filter(
      (token) =>
        token.length > 1 && !STOP.has(token) && !ARABIC_STOP.has(token)
    );
}

/** The corpus, tokenized once and reused. */
interface Index {
  readonly docs: readonly CorpusDocument[];
  readonly terms: readonly (readonly string[])[];
  readonly frequency: ReadonlyMap<string, number>;
  readonly averageLength: number;
}

let cached: Index | null = null;

function getIndex(): Index {
  if (cached) return cached;

  const docs = getCorpus();
  const terms = docs.map((doc) => tokenize(doc.text));
  const frequency = new Map<string, number>();

  for (const tokens of terms) {
    for (const term of new Set(tokens)) {
      frequency.set(term, (frequency.get(term) ?? 0) + 1);
    }
  }

  const averageLength =
    terms.reduce((sum, tokens) => sum + tokens.length, 0) / Math.max(terms.length, 1);

  cached = { docs, terms, frequency, averageLength };
  return cached;
}

/**
 * Ranks the corpus against a question.
 *
 * @param query - What was asked, in natural language.
 * @param limit - How many documents to return.
 * @returns The best matches, highest first. Empty when nothing matched at
 *   all, which is the signal that the site cannot answer the question.
 */
export function retrieve(query: string, limit = 5): readonly Hit[] {
  const { docs, terms, frequency, averageLength } = getIndex();
  // Arabic tokens can never match an English index; only what the alias
  // table produced from them can, so they are dropped before scoring.
  const asked = searchable(expand(tokenize(query)));
  if (asked.length === 0) return [];

  const total = docs.length;
  const hits: Hit[] = [];

  for (let index = 0; index < total; index += 1) {
    const tokens = terms[index];
    let score = 0;

    for (const term of new Set(asked)) {
      const inDoc = tokens.filter((token) => token === term).length;
      if (inDoc === 0) continue;

      // Standard BM25 idf, floored so a term in almost every document
      // contributes nothing rather than going negative.
      const containing = frequency.get(term) ?? 0;
      const idf = Math.max(
        0,
        Math.log(1 + (total - containing + 0.5) / (containing + 0.5))
      );

      score +=
        idf *
        ((inDoc * (K1 + 1)) /
          (inDoc + K1 * (1 - B + (B * tokens.length) / averageLength)));
    }

    if (score > 0) hits.push({ doc: docs[index], score });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
