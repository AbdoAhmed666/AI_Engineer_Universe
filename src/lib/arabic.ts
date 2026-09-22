/**
 * Arabic support for the retriever.
 *
 * The corpus is English and will stay English — it is generated from the
 * same project definitions the diagram and the city are drawn from, and
 * translating it would mean maintaining a second set of claims that could
 * drift from the first. That is exactly the failure this project is built
 * to avoid.
 *
 * So Arabic is handled at the query, not in the index: a question is
 * normalised, then the Arabic words that name something the corpus knows
 * about are mapped onto the corpus term. "دوكر" and "container" both end
 * up searching for "docker".
 *
 * This is the same honest dictionary as the English expansion, not
 * translation and not semantics. It covers the vocabulary of this corpus —
 * fifty documents about three projects — and nothing else, and the eval
 * says how well.
 *
 * Mixed writing is the realistic case and it already worked before any of
 * this: Egyptians type "هو يعرف Docker؟", and "Docker" survives
 * tokenizing on its own. This widens that to the fully-Arabic question.
 */

/**
 * Arabic letters and their marks — deliberately not the whole block.
 *
 * U+0600..U+061F is punctuation, the question mark ؟ among it, and
 * U+0660..U+0669 are the Arabic-Indic digits. Counting those as word
 * characters glues ؟ onto the word before it, so "Docker؟" stops being
 * the token "docker" and matches nothing at all.
 */
export const ARABIC_WORD = "\\u0621-\\u065F\\u0670-\\u06D3";

const ARABIC = new RegExp(`[${ARABIC_WORD}]`);

/** Harakat, tanwin and the superscript alef — decoration, never meaning. */
const DIACRITICS = /[ً-ٰٟ]/g;

/** Kashida: a typographic stretch with no phonetic value. */
const TATWEEL = /ـ/g;

/** Whether a string contains any Arabic letter. */
export function hasArabic(text: string): boolean {
  return ARABIC.test(text);
}

/**
 * Folds the spellings of one Arabic word onto a single form.
 *
 * People type أ, إ, ا and ٱ interchangeably, end words with ة or ه, and
 * write ى for ي — all of which are the same word to a reader and three
 * different keys to a Map. The definite article is stripped too, since
 * "الداتابيز" and "داتابيز" are one lookup.
 *
 * @param token - One word, already lower-cased and split out.
 * @returns The folded form.
 */
export function normalizeArabic(token: string): string {
  let out = token
    .replace(DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[آأإٱ]/g, "ا") // آ أ إ ٱ → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه") // ة → ه
    .replace(/ؤ/g, "و") // ؤ → و
    .replace(/ئ/g, "ي"); // ئ → ي

  // The definite article, but only when something substantial is left —
  // "الا" and "الي" are words, not an article with a stem behind it.
  if (out.startsWith("ال") && out.length >= 5) out = out.slice(2);

  return out;
}

/**
 * Arabic words that carry no signal.
 *
 * Written in folded form, because that is what they are compared against.
 * Deliberately short, same as the English list: over-stripping a technical
 * corpus loses terms that matter.
 */
export const ARABIC_STOP: ReadonlySet<string> = new Set([
  "ال", "في", "من", "علي", "عن", "مع", "الي", "هو", "هي", "هم", "ده", "دي",
  "دا", "ايه", "ايش", "شو", "اللي", "هل", "ما", "ماذا", "كيف", "ازاي", "ليه",
  "لماذا", "امتي", "متي", "فين", "اين", "انا", "انت", "احنا", "كان", "كانت",
  "يعني", "او", "لو", "عشان", "علشان", "كل", "بس", "بتاع", "بتاعه", "بتاعت",
  "بتاعها", "عايز", "عاوز", "اريد", "ممكن", "فيه", "عند", "عندك", "عنده",
  "لديه", "قال", "حاجه", "شي", "شيء", "اي", "ولا", "زي", "كده", "برضه",
  "طيب", "قبل", "بعد", "برضو", "دلوقتي", "خلاص", "كمان",
]);

/**
 * Arabic vocabulary mapped onto the corpus.
 *
 * Keys are folded forms. Values are terms that actually appear in the
 * corpus — checked against it, not guessed — so an entry either retrieves
 * something or is dead weight the eval will expose.
 *
 * Arabic inflects at both ends, and this is a dictionary rather than a
 * stemmer, so the forms people actually type are listed: "نشر" and
 * "منشور" are separate keys because one is the verb and one is what you
 * say about a deployed project. When a question keeps the technical term
 * in English, none of this is needed.
 */
export const ARABIC_ALIASES: ReadonlyMap<string, readonly string[]> = new Map([
  // Tools and infrastructure.
  ["دوكر", ["docker"]],
  ["كونتينر", ["docker"]],
  ["حاويه", ["docker"]],
  ["قاعده", ["postgresql", "database", "faiss", "firebase"]],
  ["قواعد", ["postgresql", "database", "faiss", "firebase"]],
  ["داتابيز", ["postgresql", "database"]],
  ["بيانات", ["data", "dataset", "database", "postgresql"]],
  ["سيرفر", ["service", "fastapi", "backend", "rest"]],
  ["خادم", ["service", "fastapi", "backend"]],
  ["باك", ["fastapi", "backend", "service", "api"]],
  ["فرونت", ["next.js", "react", "frontend", "client"]],
  ["واجهه", ["interface", "frontend", "client", "react"]],
  ["استضافه", ["azure", "railway", "deployed"]],

  // Deployment.
  ["نشر", ["deployed", "deployment", "docker", "railway", "azure"]],
  ["منشور", ["deployed", "deployment", "docker", "railway", "azure"]],
  ["رفع", ["deployed", "deployment"]],
  ["شغال", ["production", "deployed", "live"]],
  ["انتاج", ["production", "grade"]],

  // AI and ML.
  ["نموذج", ["model", "llm", "bilstm", "lstm"]],
  ["موديل", ["model", "llm", "bilstm"]],
  ["نماذج", ["models", "model", "llms"]],
  ["ذكاء", ["llm", "llms", "learning", "model"]],
  ["تعلم", ["learning", "deep", "keras", "tensorflow"]],
  ["عميق", ["deep", "learning", "bilstm", "lstm"]],
  ["تدريب", ["trained", "dataset", "samples"]],
  ["دقه", ["accuracy", "confidence", "scored"]],
  ["تقييم", ["evaluation", "scoring", "criteria", "feedback"]],
  ["يقيم", ["evaluation", "scoring", "criteria"]],
  ["بيقيم", ["evaluation", "scoring", "criteria"]],
  ["تقيم", ["evaluation", "scoring", "criteria"]],
  ["قياس", ["evaluation", "scoring", "median"]],
  ["مخرجات", ["output", "answers", "responses", "generation"]],
  ["تضمين", ["embeddings", "embedding", "vectors"]],
  ["امبيدنج", ["embeddings", "embedding"]],
  ["متجه", ["vector", "vectors", "faiss"]],
  ["متجهات", ["vector", "vectors", "faiss"]],
  ["بحث", ["retrieval", "search", "faiss", "semantic", "keyword"]],
  ["استرجاع", ["retrieval", "retrieved", "rag"]],
  ["فهرس", ["index", "faiss", "embeddings"]],
  ["توليد", ["generation", "generates", "generated"]],
  ["ضغط", ["quantization", "int8", "size", "reduction"]],
  ["تصغير", ["quantization", "int8", "size"]],
  ["تسريع", ["latency", "optimization", "inference"]],
  ["سرعه", ["latency", "optimization", "realtime"]],
  ["زمن", ["latency", "median", "inference"]],
  ["ذاكره", ["memory", "session", "history"]],

  // Security and accounts.
  ["مصادقه", ["jwt", "authentication"]],
  ["دخول", ["jwt", "authentication", "session", "registration"]],
  ["تسجيل", ["registration", "session", "logging", "log"]],
  ["امان", ["jwt", "authentication"]],

  // Hardware.
  ["اجهزه", ["esp32", "imu", "sensors", "iot", "wearable"]],
  ["جهاز", ["esp32", "imu", "sensors", "wearable"]],
  ["هاردوير", ["esp32", "imu", "sensors"]],
  ["حساسات", ["sensors", "imu", "esp32"]],
  ["مستشعر", ["sensors", "imu"]],

  // The projects themselves.
  ["مشروع", ["project", "graduation", "application"]],
  ["مشاريع", ["project", "application"]],
  ["تخرج", ["graduation", "gesture"]],
  ["مقابله", ["interview", "agent"]],
  ["انترفيو", ["interview", "agent"]],
  ["توظيف", ["hiring", "interview", "role"]],
  ["معرفه", ["knowledge", "corpus", "internal"]],
  ["وثائق", ["documents", "pdf", "corpus"]],
  ["مستندات", ["documents", "pdf", "extraction"]],
  ["ايماءات", ["gesture", "gestures", "recognition"]],
  ["ايماءه", ["gesture", "gestures", "recognition"]],
  ["حركه", ["gesture", "motion", "recognition"]],
  ["اشاره", ["gesture", "recognition"]],
  ["منزل", ["home", "smart", "iot"]],
  ["بيت", ["home", "smart", "iot"]],
  ["ذكي", ["smart", "home", "iot"]],

  // Work and process.
  ["فريق", ["team", "5-member", "led", "development"]],
  ["قياده", ["led", "team", "5-member"]],
  ["خبره", ["production", "built", "project"]],
  ["لغه", ["python", "typescript"]],
  ["بايثون", ["python"]],
  ["برمجه", ["python", "typescript", "backend"]],
  ["هندسه", ["architecture", "infrastructure", "pipeline"]],
  ["معماريه", ["architecture", "layers", "modular"]],
  ["بنيه", ["architecture", "infrastructure", "pipeline"]],
  ["مراحل", ["stage", "stages", "pipeline"]],
  ["مرحله", ["stage", "stages"]],
  ["طبقه", ["layer", "layers"]],
  ["طبقات", ["layer", "layers"]],
  ["سياق", ["context", "grounded", "passages"]],
  ["سؤال", ["question", "query", "questions"]],
  ["اجابه", ["answer", "answers", "responses"]],
  ["رد", ["answer", "responses", "streaming"]],
]);
