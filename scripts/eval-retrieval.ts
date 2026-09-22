/**
 * Retrieval eval.
 *
 * Questions a visitor plausibly types, each with the substring the right
 * answer must contain. Scores hit@1 and hit@3, and prints every miss with
 * what came back instead, because the misses are the only part worth
 * reading.
 *
 * Scored per language. The corpus is English; Arabic reaches it only
 * through the alias table in src/lib/arabic.ts, so the Arabic set is what
 * says whether that table actually works. A word missing from it fails
 * here rather than in front of a visitor.
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

/** One scored group of questions. */
interface Suite {
  readonly name: string;
  readonly cases: readonly Case[];
}

const ENGLISH: readonly Case[] = [
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

/**
 * Arabic, as it is actually typed.
 *
 * Three shapes, because all three turn up: fully Arabic, Arabic carrying
 * the English technical term (the common Egyptian case), and Arabic with
 * spellings folded differently — أ against ا, ة against ه.
 */
const ARABIC: readonly Case[] = [
  // Fully Arabic — these pass only through the alias table.
  { q: "هو يعرف دوكر؟", expect: "Docker" },
  { q: "إيه قاعدة البيانات اللي بيستخدمها؟", expect: "PostgreSQL" },
  { q: "بيعمل البحث إزاي؟", expect: "FAISS" },
  { q: "إيه مشروع التخرج بتاعه؟", expect: "Gesture" },
  { q: "قاد فريق قبل كده؟", expect: "5-member" },
  { q: "إيه الأجهزة اللي اشتغل عليها؟", expect: "ESP32" },
  { q: "بيقيّم مخرجات النموذج إزاي؟", expect: "Evaluation" },
  { q: "عنده حاجة في تصغير النماذج؟", expect: "quantization" },
  { q: "بيعمل تسجيل الدخول إزاي؟", expect: "JWT" },
  { q: "إيه طبقات مشروع الإيماءات؟", expect: "Gesture" },
  { q: "المشروع منشور فين؟", expect: "deployed" },
  { q: "إيه مراحل الاسترجاع؟", expect: "Retrieval" },

  // Mixed — the realistic case, and it needs no table at all.
  { q: "هو يعرف Docker؟", expect: "Docker" },
  { q: "هو بيستخدم إيه في الـ retrieval؟", expect: "Retrieval" },
  { q: "إيه اللي اتعمل بـ FAISS؟", expect: "FAISS" },

  // Spelling variants that must fold onto the same lookup.
  { q: "هو يعرف دوكر", expect: "Docker" },
  { q: "ايه الاجهزه اللي اشتغل عليها", expect: "ESP32" },

  // Should find nothing: the site makes no such claim.
  { q: "هو يعرف Kubernetes؟", expect: "" },
  { q: "إيه مرتبه؟", expect: "" },
];

const SUITES: readonly Suite[] = [
  { name: "English", cases: ENGLISH },
  { name: "Arabic", cases: ARABIC },
];

let failed = false;

for (const suite of SUITES) {
  console.log(`\n── ${suite.name}`);

  let hit1 = 0;
  let hit3 = 0;
  const misses: string[] = [];

  for (const testCase of suite.cases) {
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

    const wanted = testCase.expect.toLowerCase();
    const at1 = texts[0]?.toLowerCase().includes(wanted);
    const at3 = texts.some((text) => text.toLowerCase().includes(wanted));

    if (at1) hit1 += 1;
    if (at3) hit3 += 1;
    else {
      misses.push(
        `  ✗ "${testCase.q}"  (wanted "${testCase.expect}")\n` +
          (texts.length === 0
            ? "      (nothing retrieved)"
            : texts
                .map((text, index) => `      ${index + 1}. ${text.slice(0, 84)}`)
                .join("\n"))
      );
    }
  }

  const n = suite.cases.length;
  console.log(`\n  hit@1  ${hit1}/${n}  (${((hit1 / n) * 100).toFixed(0)}%)`);
  console.log(`  hit@3  ${hit3}/${n}  (${((hit3 / n) * 100).toFixed(0)}%)`);

  if (misses.length) {
    failed = true;
    console.log(`\n  ${misses.length} miss(es):\n${misses.join("\n")}`);
  } else {
    console.log("  no misses");
  }
}

// A miss is a visitor being told the site says nothing about something it
// does say, so this fails the command rather than only printing.
process.exitCode = failed ? 1 : 0;
