/**
 * Canonical AI pipeline model.
 *
 * The single source of truth for the retrieval-augmented system the Hero
 * depicts. It is deliberately a plain, typed data structure with no
 * rendering concerns, so that every representation reads from it:
 *
 *   pipeline.ts
 *     ├── SystemSchematic.tsx    current 2D inline-SVG representation
 *     └── SignalPathScene.tsx    future 3D representation
 *
 * Content rule: every stage label and every entry in `technologies` must be
 * traceable to something already claimed in `src/sections/Projects.tsx` or
 * `src/sections/Skills.tsx`. Nothing here describes a running service,
 * live telemetry or infrastructure that is not already documented on the
 * page. Stages that could not be substantiated (chunking, reranking) are
 * omitted rather than assumed.
 *
 * @example
 * import { pipeline, getPhaseGroups } from "@/lib/pipeline";
 *
 * for (const group of getPhaseGroups(pipeline)) {
 *   console.log(group.phase.label, group.stages.length);
 * }
 */

import type { ProjectId } from "./projects";

/** Identifier for the two halves of the system. */
export type PipelinePhaseId = "build" | "request";

/**
 * One half of the system's lifecycle.
 *
 * `build` runs once, ahead of time, to produce the searchable index.
 * `request` runs for every incoming question.
 */
export interface PipelinePhase {
  /** Stable identifier, referenced by {@link PipelineStage.phase}. */
  readonly id: PipelinePhaseId;
  /** Short display label, e.g. `"Build"`. */
  readonly label: string;
  /** When this half of the system runs, e.g. `"indexed once"`. */
  readonly cadence: string;
  /** One-sentence explanation, used by non-visual representations. */
  readonly description: string;
}

/**
 * A single stage of the pipeline.
 *
 * `role` is the sentence a reader should come away with; `technologies`
 * are the concrete tools behind it; `projects` points at the work that
 * substantiates the claim.
 */
export interface PipelineStage {
  /** Stable identifier, unique within {@link Pipeline.stages}. */
  readonly id: string;
  /** Short display label, e.g. `"Retrieval"`. */
  readonly label: string;
  /** What happens at this stage, in one sentence. */
  readonly role: string;
  /** Tools used here. Each one appears in `Skills.tsx` or `Projects.tsx`. */
  readonly technologies: readonly string[];
  /** The half of the lifecycle this stage belongs to. */
  readonly phase: PipelinePhaseId;
  /** Ids of the projects that substantiate this stage. See `@/lib/projects`. */
  readonly projects: readonly ProjectId[];
}

/** A complete pipeline: its framing copy, its phases and its ordered stages. */
export interface Pipeline {
  /** Short name of the architecture, e.g. `"Retrieval-augmented architecture"`. */
  readonly title: string;
  /** One or two sentences framing what the diagram shows and where it comes from. */
  readonly summary: string;
  /** The phases, in execution order. */
  readonly phases: readonly PipelinePhase[];
  /** The stages, in flow order. */
  readonly stages: readonly PipelineStage[];
}

/**
 * The retrieval-augmented architecture shared by the two LLM projects on
 * the page. The gesture-recognition project is deliberately out of scope
 * here: it is a deep-learning system, not a retrieval one.
 */
export const pipeline: Pipeline = {
  title: "Retrieval-augmented architecture",
  summary:
    "The shape shared by the two LLM systems below — the AI Interview Agent and the AI Internal Knowledge Assistant. Every stage and tool shown here is one I have actually built and shipped.",
  phases: [
    {
      id: "build",
      label: "Build",
      cadence: "indexed once",
      description:
        "Runs ahead of time to turn a document corpus into a searchable vector index.",
    },
    {
      id: "request",
      label: "Request",
      cadence: "per query",
      description:
        "Runs for every incoming question, from retrieval through to the product surface.",
    },
  ],
  stages: [
    {
      id: "knowledge",
      label: "Knowledge",
      role: "A domain corpus is collected as the source of truth the system is allowed to answer from.",
      technologies: ["Python"],
      phase: "build",
      projects: ["ai-internal-knowledge-assistant"],
    },
    {
      id: "embeddings",
      label: "Embeddings",
      role: "Documents are encoded as vectors, so they can be compared by meaning rather than by keyword.",
      technologies: ["Embeddings", "LangChain"],
      phase: "build",
      projects: ["ai-internal-knowledge-assistant"],
    },
    {
      id: "index",
      label: "Index",
      role: "Those vectors are written to a FAISS index that can be searched in a single pass.",
      technologies: ["FAISS"],
      phase: "build",
      projects: ["ai-internal-knowledge-assistant", "ai-interview-agent"],
    },
    {
      id: "retrieval",
      label: "Retrieval",
      role: "An incoming query is embedded and matched against the index, returning the passages most likely to answer it.",
      technologies: ["FAISS", "LangChain"],
      phase: "request",
      projects: ["ai-internal-knowledge-assistant", "ai-interview-agent"],
    },
    {
      id: "context",
      label: "Context",
      role: "Retrieved passages are assembled into the prompt, so the answer is grounded in the corpus instead of the model's memory.",
      technologies: ["RAG"],
      phase: "request",
      projects: ["ai-internal-knowledge-assistant", "ai-interview-agent"],
    },
    {
      id: "generation",
      label: "Generation",
      role: "The model answers from that context, orchestrated as modular tool calls rather than one monolithic prompt; INT8 quantization keeps inference viable on CPU.",
      technologies: ["LLMs", "LangChain", "OpenAI", "Tool Calling", "Quantization"],
      phase: "request",
      projects: ["ai-internal-knowledge-assistant", "ai-interview-agent"],
    },
    {
      id: "evaluation",
      label: "Evaluation",
      role: "Output is scored against structured criteria, turned into written feedback, and checked for knowledge gaps.",
      technologies: ["LLMs"],
      phase: "request",
      projects: ["ai-interview-agent"],
    },
    {
      id: "service",
      label: "Service",
      role: "REST and streaming endpoints expose the system, with authentication, session state and persistence behind them.",
      technologies: ["FastAPI", "REST APIs", "JWT Auth", "PostgreSQL"],
      phase: "request",
      projects: ["ai-interview-agent", "ai-internal-knowledge-assistant"],
    },
    {
      id: "application",
      label: "Application",
      role: "The product surface people actually use: sessions, history, analytics and generated reports.",
      technologies: ["Next.js", "React", "TypeScript"],
      phase: "request",
      projects: ["ai-interview-agent"],
    },
  ],
};

/** A phase paired with its stages and their positions in the flow. */
export interface PipelinePhaseGroup {
  /** The phase being described. */
  readonly phase: PipelinePhase;
  /** The stages belonging to it, in flow order. */
  readonly stages: readonly PipelineStage[];
  /** Index of the first stage within {@link Pipeline.stages}. */
  readonly startIndex: number;
  /** Index of the last stage within {@link Pipeline.stages}. */
  readonly endIndex: number;
}

/**
 * Groups a pipeline's stages by phase, preserving flow order.
 *
 * Both the 2D schematic and any future 3D scene need to know where one
 * phase ends and the next begins, so the grouping lives with the data
 * rather than in a single representation.
 *
 * @param source - The pipeline to group. Defaults to {@link pipeline}.
 * @returns One group per phase that has at least one stage.
 */
export function getPhaseGroups(
  source: Pipeline = pipeline
): readonly PipelinePhaseGroup[] {
  const groups: PipelinePhaseGroup[] = [];

  for (const phase of source.phases) {
    const startIndex = source.stages.findIndex((stage) => stage.phase === phase.id);
    if (startIndex === -1) continue;

    const stages = source.stages.filter((stage) => stage.phase === phase.id);
    const endIndex = source.stages.findLastIndex(
      (stage) => stage.phase === phase.id
    );
    groups.push({ phase, stages, startIndex, endIndex });
  }

  return groups;
}

/**
 * Formats a stage's position as a zero-padded ordinal, e.g. `"03"`.
 *
 * @param index - Zero-based index of the stage within the flow.
 * @returns The two-digit label.
 */
export function formatStageOrdinal(index: number): string {
  return String(index + 1).padStart(2, "0");
}
