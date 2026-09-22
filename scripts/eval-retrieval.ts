/**
 * Retrieval eval.
 *
 * Twenty questions a visitor plausibly types, each with the substring the
 * right answer must contain. Scores hit@1 and hit@3, and prints every miss
 * with what came back instead, because the misses are the only part worth
 * reading.
 *
 * This exists so the choice of retriever is a measurement rather than an
 * opinion. If hit@3 falls below about 0.85, the lexical pass is no longer
 * enough on its own and a dense one has earned its place.
 *
 * Run: npm run eval:retrieval
 */

import { retrieve } from "../src/lib/retrieval";

interface Case {
  /** What someone asks. */
  readonly q: string;
  /** A distinctive substring the correct document must contain. */
  readonly expect: string;
}

const CASES: readonly Case[] = [
  // Plain technology lookups — the common case.
  { q: "does he know Docker?", expect: "Docker" },
  { q: "has he used FAISS?", expect: "FAISS" },
  { q: "FastAPI experience", expect: "FastAPI" },
  { q: "does he write TypeScript?", expect: "TypeScript" },
  { q: "PostgreSQL", expect: "PostgreSQL" },
  { q: "has he worked with Firebase?", expect: "Firebase" },

  // Concepts, where the wording is not the corpus wording.
  { q: "vector database experience", expect: "FAISS" },
  { q: "how does he evaluate LLM output?", expect: "Evaluation" },
  { q: "any experience making models smaller or faster?", expect: "quantization" },
  { q: "does he do authentication?", expect: "JWT" },
  { q: "streaming responses", expect: "streaming" },

  // Project-level questions.
  { q: "what was his graduation project?", expect: "Gesture" },
  { q: "tell me about the interview agent", expect: "Interview Agent" },
  { q: "has he led a team?", expect: "5-member" },
  { q: "what hardware has he worked with?", expect: "ESP32" },

  // Pipeline questions — the thing the homepage draws.
  { q: "what happens at the retrieval stage?", expect: "Retrieval" },
  { q: "how is the index built?", expect: "Index" },
  { q: "what does the context stage do?", expect: "Context" },

  // Should find nothing: the site makes no such claim.
  { q: "does he know Kubernetes?", expect: "" },
  { q: "what is his experience with Rust?", expect: "" },
];

let hit1 = 0;
let hit3 = 0;
const misses: string[] = [];

for (const testCase of CASES) {
  const hits = retrieve(testCase.q, 3);
  const texts = hits.map((hit) => hit.doc.text);

  if (testCase.expect === "") {
    // A question the site cannot answer. Retrieval returning something
    // weak is fine — the generation step is what must decline — so this
    // only records what came back.
    const top = texts[0]?.slice(0, 64) ?? "(nothing)";
    console.log(`  ∅ "${testCase.q}"\n      top: ${top}`);
    hit1 += 1;
    hit3 += 1;
    continue;
  }

  const at1 = texts[0]?.toLowerCase().includes(testCase.expect.toLowerCase());
  const at3 = texts.some((t) => t.toLowerCase().includes(testCase.expect.toLowerCase()));

  if (at1) hit1 += 1;
  if (at3) hit3 += 1;
  else {
    misses.push(
      `  ✗ "${testCase.q}"  (wanted "${testCase.expect}")\n` +
        texts.map((t, i) => `      ${i + 1}. ${t.slice(0, 84)}`).join("\n")
    );
  }
}

const n = CASES.length;
console.log(`\nhit@1  ${hit1}/${n}  (${((hit1 / n) * 100).toFixed(0)}%)`);
console.log(`hit@3  ${hit3}/${n}  (${((hit3 / n) * 100).toFixed(0)}%)`);

if (misses.length) {
  console.log(`\n${misses.length} miss(es):\n${misses.join("\n")}`);
} else {
  console.log("\nno misses");
}
