/**
 * Scene layout.
 *
 * Turns the canonical pipeline into 3D coordinates. Deliberately imports
 * nothing from `three`: the layout is plain arithmetic over `@/lib/pipeline`,
 * so it can be read, tested and reasoned about without a renderer, and the
 * 2D schematic could later be driven from the same numbers.
 *
 * Depth carries meaning rather than decoration. The build phase — the corpus
 * being embedded and indexed — sits behind the request path, because that is
 * where it runs: once, ahead of time, feeding the line the query travels.
 *
 * @example
 * import { getSceneLayout } from "./layout";
 *
 * const { nodes, rail } = getSceneLayout();
 */

import { getPhaseGroups, pipeline, type PipelinePhaseId } from "@/lib/pipeline";

/** A point in scene space. */
export type Vec3 = readonly [number, number, number];

/** One pipeline stage placed in the scene. */
export interface StageNode {
  /** Matches `PipelineStage.id`. */
  readonly id: string;
  /** Short display label. */
  readonly label: string;
  /** Which half of the lifecycle the stage belongs to. */
  readonly phase: PipelinePhaseId;
  /** Position within the flow, zero-based. */
  readonly index: number;
  /** Centre of the stage plate. */
  readonly position: Vec3;
}

/** A laid-out scene: the stages, the path between them, and its extent. */
export interface SceneLayout {
  readonly nodes: readonly StageNode[];
  /** Points of the rail, in flow order. */
  readonly rail: readonly Vec3[];
  /**
   * The corpus: a lattice of marks set behind and below the request path,
   * standing for the indexed documents. Retrieval reaches back into it.
   */
  readonly field: readonly Vec3[];
  /** The subset of {@link field} that a query returns. */
  readonly retrieved: readonly Vec3[];
  /** Line segments from the retrieval stage down to each retrieved mark. */
  readonly reach: readonly Vec3[];
  /** X of the boundary between the build and request halves, if there is one. */
  readonly phaseBoundaryX: number | null;
  /** Half-width and half-depth of the occupied space, for framing. */
  readonly extent: { readonly x: number; readonly z: number };
}

/** Spacing between consecutive stages along the flow axis. */
const STEP = 1.6;

/** How far behind the request path the build phase sits. */
const BUILD_DEPTH = -1.15;

/** Depth of a stage for its phase. */
function depthFor(phase: PipelinePhaseId): number {
  return phase === "build" ? BUILD_DEPTH : 0;
}

/** Shape of the corpus lattice. */
const FIELD = {
  columns: 16,
  rows: 5,
  spacingX: 0.34,
  spacingZ: 0.28,
  /** How far behind the build row the lattice starts. */
  startZ: -1.9,
  /** Height of the lattice below the stage plane. */
  y: -0.34,
} as const;

/**
 * Positions of the corpus lattice, centred on the indexing stage.
 *
 * A regular lattice rather than a scatter: this is meant to read as a
 * structured index, and a deterministic layout means the drawing is the
 * same every time it is rendered.
 */
function buildField(centreX: number): Vec3[] {
  const points: Vec3[] = [];
  const spanX = (FIELD.columns - 1) * FIELD.spacingX;
  const originX = centreX - spanX / 2;

  for (let row = 0; row < FIELD.rows; row += 1) {
    for (let column = 0; column < FIELD.columns; column += 1) {
      points.push([
        originX + column * FIELD.spacingX,
        FIELD.y,
        FIELD.startZ - row * FIELD.spacingZ,
      ]);
    }
  }
  return points;
}

/**
 * Picks the marks a query returns.
 *
 * Fixed indices rather than a random sample: the diagram illustrates that
 * retrieval returns a small neighbourhood, and it should illustrate the
 * same one on every render.
 */
function pickRetrieved(field: readonly Vec3[]): Vec3[] {
  const columns = FIELD.columns;
  const picks = [
    columns * 1 + 6,
    columns * 2 + 7,
    columns * 2 + 9,
    columns * 3 + 8,
  ];
  return picks
    .map((index) => field[index])
    .filter((point): point is Vec3 => point !== undefined);
}

/**
 * Places every pipeline stage in scene space.
 *
 * Stages are distributed evenly along X and centred on the origin, so the
 * camera framing does not depend on how many stages the pipeline has.
 *
 * @param source - Pipeline to lay out. Defaults to the canonical one.
 * @returns The stage nodes, the rail through them, and the overall extent.
 */
export function getSceneLayout(source = pipeline): SceneLayout {
  const stages = source.stages;
  const span = (stages.length - 1) * STEP;
  const originX = -span / 2;

  const nodes: StageNode[] = stages.map((stage, index) => ({
    id: stage.id,
    label: stage.label,
    phase: stage.phase,
    index,
    position: [originX + index * STEP, 0, depthFor(stage.phase)] as const,
  }));

  const indexNode =
    nodes.find((node) => node.id === "index") ??
    nodes[Math.floor(nodes.length / 3)];
  const retrievalNode =
    nodes.find((node) => node.id === "retrieval") ?? indexNode;

  const field = buildField(indexNode.position[0]);
  const retrieved = pickRetrieved(field);

  // One segment per retrieved mark, drawn from the retrieval stage.
  const reach: Vec3[] = [];
  for (const point of retrieved) {
    reach.push(retrievalNode.position, point);
  }

  const groups = getPhaseGroups(source);
  const requestStart = groups[1]?.startIndex;
  const phaseBoundaryX =
    requestStart !== undefined &&
    nodes[requestStart - 1] !== undefined &&
    nodes[requestStart] !== undefined
      ? (nodes[requestStart - 1].position[0] + nodes[requestStart].position[0]) /
        2
      : null;

  const fieldDepth = Math.abs(
    FIELD.startZ - (FIELD.rows - 1) * FIELD.spacingZ
  );

  return {
    nodes,
    rail: nodes.map((node) => node.position),
    field,
    retrieved,
    reach,
    phaseBoundaryX,
    extent: { x: span / 2, z: fieldDepth },
  };
}

/**
 * Index of the first stage of each phase, so a renderer can mark where the
 * build half ends and the request half begins without re-deriving it.
 *
 * @param source - Pipeline to inspect. Defaults to the canonical one.
 */
export function getPhaseBoundaries(source = pipeline): readonly number[] {
  return getPhaseGroups(source).map((group) => group.startIndex);
}
