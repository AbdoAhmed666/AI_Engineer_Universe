/**
 * Project identifiers.
 *
 * A stable, typed handle for each piece of work on the site, so that other
 * modules — `@/lib/pipeline` today, the 3D scene later — can reference a
 * project without repeating its display name. `Projects.tsx` owns the full
 * content of each entry; this module owns only the id and the name, which
 * is the part other modules need.
 *
 * The full content of each project lives here too, as {@link projectDetails}.
 * It moved out of `Projects.tsx` when a second reader appeared: the section
 * renders it, and `@/lib/corpus` turns it into the documents the ask box
 * searches. A claim the site makes and a claim it can answer questions
 * about have to be the same claim, which means one copy of it.
 *
 * @example
 * import { projectNames, type ProjectId } from "@/lib/projects";
 *
 * const label = projectNames["ai-interview-agent"];
 */

/** Stable id for a project featured on the site. */
export type ProjectId =
  | "ai-interview-agent"
  | "ai-internal-knowledge-assistant"
  | "gesture-smart-home";

/** Display name for each {@link ProjectId}, as shown in the Projects section. */
export const projectNames: Record<ProjectId, string> = {
  "ai-interview-agent": "AI Interview Agent",
  "ai-internal-knowledge-assistant": "AI Internal Knowledge Assistant",
  "gesture-smart-home": "Real-Time Gesture Smart Home",
};

/** One project, as the site documents it. */
export interface ProjectDetail {
  readonly id: ProjectId;
  /** Short positioning line, e.g. `"RAG · LLM Infrastructure"`. */
  readonly tag: string;
  /** One paragraph on what the project is. */
  readonly description: string;
  /**
   * What the project does, one claim per line. These are the lines every
   * module in `@/lib/architecture` cites as its source, so they are the
   * closest thing this site has to a set of facts.
   */
  readonly capabilities: readonly string[];
  readonly tech: readonly string[];
  readonly github: string;
}

/** The featured projects, in the order the section lists them. */
export const projectDetails: readonly ProjectDetail[] = [
  {
    id: "ai-interview-agent",
    tag: "Full-Stack AI Application",
    description:
      "Production-grade AI technical interview platform using LLMs and RAG. Generates role-specific adaptive questions, evaluates answers with structured LLM scoring, and produces personalized feedback with hiring recommendations.",
    capabilities: [
      "Role-specific adaptive interview questions via LLMs",
      "LLM evaluation pipeline: scoring, feedback, knowledge-gap detection",
      "RAG pipeline with FAISS for context-aware personalization",
      "JWT authentication, session management, interview history",
      "Analytics dashboard and PDF report generation",
      "FastAPI backend + Next.js frontend, PostgreSQL persistence",
    ],
    tech: ["FastAPI", "Next.js", "PostgreSQL", "LangChain", "FAISS", "OpenAI", "Docker", "TypeScript"],
    github: "https://github.com/AbdoAhmed666/AI-Interview-Agent",
  },
  {
    id: "ai-internal-knowledge-assistant",
    tag: "RAG · LLM Infrastructure",
    description:
      "Internal knowledge assistant using RAG, embeddings, and FAISS retrieval to generate context-aware responses from a domain knowledge base. Optimized for CPU inference through INT8 quantization — reducing model size by 58.9% (293MB → 120MB).",
    capabilities: [
      "Modular RAG architecture: retrieval, generation, application layers",
      "FAISS vector retrieval with embedding-based semantic search",
      "FastAPI REST and streaming endpoints",
      "INT8 quantization: 58.9% model size reduction",
      "Docker-based deployment with documented latency trade-offs",
      "Tool-calling architecture with modular LLM orchestration",
    ],
    tech: ["Python", "FastAPI", "FAISS", "LangChain", "Docker", "Quantization", "REST API"],
    github: "https://github.com/AbdoAhmed666/electro-pi-ai-internal-knowledge-assistant",
  },
  {
    id: "gesture-smart-home",
    tag: "Graduation Project · Deep Learning · IoT",
    description:
      "Real-time gesture recognition system using a Bidirectional LSTM and wearable IMU sensors for accessibility-focused smart-home control. End to end: an ESP32 streams six-axis motion over WebSocket, a trained model classifies it, and a live client shows the result. Achieved 98% recognition accuracy with 35% latency reduction.",
    capabilities: [
      "98% gesture recognition accuracy with BiLSTM + IMU sensors",
      "35% inference latency reduction through model optimization",
      "ESP32 bridge streaming six-axis IMU data over WebSocket, with IP registration and auto-reconnect",
      "300,000-sample motion dataset: median-filter cleaning, standard-scaler normalization, feature extraction",
      "Two model families for fixed and animated gestures: Keras LSTM and Random Forest, with their own encoders and scalers",
      "WebSocket inference service with Firebase Realtime Database and prediction logging",
      "React client showing live prediction and confidence",
      "Real-time smart-home control for accessibility use cases",
      "Dockerised, deployed on Railway and Azure via GitHub Actions",
      "Led 5-member development team through full project lifecycle",
    ],
    tech: ["BiLSTM", "TensorFlow", "Keras", "ESP32", "WebSocket", "FastAPI", "Firebase", "React", "Docker", "Azure", "Railway", "Python"],
    github: "https://github.com/AbdoAhmed666",
  },
];
