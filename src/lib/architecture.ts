/**
 * Project architecture.
 *
 * What each project is actually made of, layer by layer. This is the data the
 * 3D city is generated from: a building's height is the number of layers the
 * project documents, and a floor's width is the number of modules in it.
 * Nothing about a building is drawn by hand, and no project is scored against
 * another — the geometry *is* the architecture.
 *
 * Content rule, enforceable by reading this file: every module carries the
 * `source` line it came from in `src/sections/Projects.tsx`. If a layer
 * cannot be traced to something the project already claims, it does not
 * exist here — and when the claims grow, the building grows with them.
 *
 * @example
 * import { architectures } from "@/lib/architecture";
 *
 * architectures["ai-interview-agent"].layers.length; // floors in the building
 */

import type { ProjectId } from "./projects";
import type { PipelineStage } from "./pipeline";

/**
 * The kind of work a layer does. Drives how its floor is drawn: the data
 * layer is a plinth, the interface an open frame, the AI layer the one that
 * carries the accent.
 */
export type LayerKind =
  | "data"
  | "ai"
  | "service"
  | "interface"
  | "deployment";

/** The overall shape a project's architecture takes. */
export type BuildingForm =
  /** Many thin layers stacked: a full-stack product. */
  | "tower"
  /** Fewer, wider layers with the mass in processing: a facility. */
  | "facility"
  /** Low and horizontal, with outboard connections: a control structure. */
  | "control";

/** One discrete part of a layer. */
export interface ArchitectureModule {
  /** Short display label. */
  readonly label: string;
  /** The capability line in `Projects.tsx` this came from. */
  readonly source: string;
}

/** One architectural layer of a project. */
export interface ArchitectureLayer {
  readonly id: string;
  /** Short display label, e.g. `"Service"`. */
  readonly label: string;
  readonly kind: LayerKind;
  /** The parts of this layer. Floor width is derived from how many there are. */
  readonly modules: readonly ArchitectureModule[];
  /** Pipeline stages this layer implements, if any. */
  readonly stages: readonly PipelineStage["id"][];
}

/** A project's architecture, ordered ground upward. */
export interface ProjectArchitecture {
  readonly id: ProjectId;
  readonly form: BuildingForm;
  /** Ordered bottom to top, the way the building is stacked. */
  readonly layers: readonly ArchitectureLayer[];
}

/**
 * The three featured projects, derived only from what they already document.
 *
 * Forms are not chosen for variety, and two of them have changed as the
 * projects were read more carefully rather than to make the skyline more
 * interesting.
 *
 * The interview agent documents four distinct stacked layers — data, AI,
 * service, interface — so it is a tower. The knowledge assistant names its
 * own layers, "Modular RAG architecture: retrieval, generation, application
 * layers", and concentrates its mass in processing, so it is a facility.
 *
 * The gesture system was a control structure here for as long as this file
 * described it as a model with sensors attached. Its repositories document
 * five stacked layers — an ESP32 bridge, a cleaned 300k-sample dataset, two
 * model families, a WebSocket service with a realtime database, and a React
 * client — which is a full stack and therefore a tower. It is the tallest
 * building in the city because it is the project with the most layers.
 */
export const architectures: Record<ProjectId, ProjectArchitecture> = {
  "ai-interview-agent": {
    id: "ai-interview-agent",
    form: "tower",
    layers: [
      {
        id: "data",
        label: "Data",
        kind: "data",
        stages: ["index"],
        modules: [
          {
            label: "PostgreSQL",
            source: "FastAPI backend + Next.js frontend, PostgreSQL persistence",
          },
          {
            label: "FAISS index",
            source: "RAG pipeline with FAISS for context-aware personalization",
          },
        ],
      },
      {
        id: "ai",
        label: "AI",
        kind: "ai",
        stages: ["retrieval", "context", "generation", "evaluation"],
        modules: [
          {
            label: "Question generation",
            source: "Role-specific adaptive interview questions via LLMs",
          },
          {
            label: "Evaluation pipeline",
            source:
              "LLM evaluation pipeline: scoring, feedback, knowledge-gap detection",
          },
          {
            label: "RAG personalization",
            source: "RAG pipeline with FAISS for context-aware personalization",
          },
        ],
      },
      {
        id: "service",
        label: "Service",
        kind: "service",
        stages: ["service"],
        modules: [
          {
            label: "FastAPI",
            source: "FastAPI backend + Next.js frontend, PostgreSQL persistence",
          },
          {
            label: "JWT auth",
            source: "JWT authentication, session management, interview history",
          },
          {
            label: "Sessions",
            source: "JWT authentication, session management, interview history",
          },
          {
            label: "History",
            source: "JWT authentication, session management, interview history",
          },
        ],
      },
      {
        id: "interface",
        label: "Interface",
        kind: "interface",
        stages: ["application"],
        modules: [
          {
            label: "Next.js client",
            source: "FastAPI backend + Next.js frontend, PostgreSQL persistence",
          },
          {
            label: "Analytics dashboard",
            source: "Analytics dashboard and PDF report generation",
          },
          {
            label: "PDF reports",
            source: "Analytics dashboard and PDF report generation",
          },
        ],
      },
    ],
  },

  "ai-internal-knowledge-assistant": {
    id: "ai-internal-knowledge-assistant",
    form: "facility",
    layers: [
      {
        id: "data",
        label: "Corpus",
        kind: "data",
        stages: ["knowledge", "embeddings", "index"],
        modules: [
          {
            label: "Knowledge base",
            source:
              "Internal knowledge assistant using RAG, embeddings, and FAISS retrieval",
          },
          {
            label: "FAISS index",
            source:
              "FAISS vector retrieval with embedding-based semantic search",
          },
        ],
      },
      {
        id: "ai",
        label: "Processing",
        kind: "ai",
        stages: ["retrieval", "context", "generation"],
        modules: [
          {
            label: "Retrieval layer",
            source:
              "Modular RAG architecture: retrieval, generation, application layers",
          },
          {
            label: "Generation layer",
            source:
              "Modular RAG architecture: retrieval, generation, application layers",
          },
          {
            label: "Tool calling",
            source: "Tool-calling architecture with modular LLM orchestration",
          },
          {
            label: "INT8 quantization",
            source: "INT8 quantization: 58.9% model size reduction",
          },
        ],
      },
      {
        id: "service",
        label: "Service",
        kind: "service",
        stages: ["service"],
        modules: [
          { label: "FastAPI REST", source: "FastAPI REST and streaming endpoints" },
          { label: "Streaming", source: "FastAPI REST and streaming endpoints" },
        ],
      },
      {
        id: "interface",
        label: "Application",
        kind: "interface",
        stages: ["application"],
        modules: [
          {
            label: "Application layer",
            source:
              "Modular RAG architecture: retrieval, generation, application layers",
          },
        ],
      },
    ],
  },

  "gesture-smart-home": {
    id: "gesture-smart-home",
    form: "tower",
    layers: [
      {
        id: "sensors",
        label: "Sensors",
        kind: "data",
        stages: [],
        modules: [
          {
            label: "ESP32 bridge",
            source:
              "ESP32 bridge streaming six-axis IMU data over WebSocket, with IP registration and auto-reconnect",
          },
          {
            label: "IMU stream",
            source: "98% gesture recognition accuracy with BiLSTM + IMU sensors",
          },
        ],
      },
      {
        id: "data",
        label: "Data",
        kind: "data",
        stages: [],
        modules: [
          {
            label: "300k motion samples",
            source:
              "300,000-sample motion dataset: median-filter cleaning, standard-scaler normalization, feature extraction",
          },
          {
            label: "Cleaning",
            source:
              "300,000-sample motion dataset: median-filter cleaning, standard-scaler normalization, feature extraction",
          },
          {
            label: "Normalization",
            source:
              "300,000-sample motion dataset: median-filter cleaning, standard-scaler normalization, feature extraction",
          },
          {
            label: "Feature extraction",
            source:
              "300,000-sample motion dataset: median-filter cleaning, standard-scaler normalization, feature extraction",
          },
        ],
      },
      {
        id: "ai",
        label: "Model",
        kind: "ai",
        stages: [],
        modules: [
          {
            label: "BiLSTM",
            source: "98% gesture recognition accuracy with BiLSTM + IMU sensors",
          },
          {
            label: "Random Forest",
            source:
              "Two model families for fixed and animated gestures: Keras LSTM and Random Forest, with their own encoders and scalers",
          },
          {
            label: "Encoders and scalers",
            source:
              "Two model families for fixed and animated gestures: Keras LSTM and Random Forest, with their own encoders and scalers",
          },
          {
            label: "Latency optimization",
            source: "35% inference latency reduction through model optimization",
          },
        ],
      },
      {
        id: "service",
        label: "Service",
        kind: "service",
        stages: [],
        modules: [
          {
            label: "WebSocket inference",
            source:
              "WebSocket inference service with Firebase Realtime Database and prediction logging",
          },
          {
            label: "Firebase realtime DB",
            source:
              "WebSocket inference service with Firebase Realtime Database and prediction logging",
          },
          {
            label: "Prediction log",
            source:
              "WebSocket inference service with Firebase Realtime Database and prediction logging",
          },
          {
            label: "Home control",
            source: "Real-time smart-home control for accessibility use cases",
          },
        ],
      },
      {
        id: "interface",
        label: "Client",
        kind: "interface",
        stages: [],
        modules: [
          {
            label: "React client",
            source: "React client showing live prediction and confidence",
          },
          {
            label: "Live confidence",
            source: "React client showing live prediction and confidence",
          },
        ],
      },
    ],
  },
};

/**
 * Deployment targets for a project, drawn as the plinth its building stands
 * on. A project with none would stand on bare ground.
 */
export const deployments: Record<ProjectId, readonly string[]> = {
  "ai-interview-agent": ["Docker"],
  "ai-internal-knowledge-assistant": ["Docker"],
  "gesture-smart-home": ["Docker", "Railway", "Azure"],
};

/** Every project id, in the order the city places them. */
export const cityOrder: readonly ProjectId[] = [
  "ai-interview-agent",
  "ai-internal-knowledge-assistant",
  "gesture-smart-home",
];
