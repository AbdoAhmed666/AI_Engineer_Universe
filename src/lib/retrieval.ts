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

import { getCorpus, type CorpusDocument } from "./corpus";

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

/** Lower-cases, splits on anything that is not a word character, drops noise. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((token) => token.replace(/^\.+|\.+$/g, ""))
    .filter((token) => token.length > 1 && !STOP.has(token));
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
  const asked = tokenize(query);
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
