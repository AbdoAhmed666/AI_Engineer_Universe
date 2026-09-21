/**
 * City layout.
 *
 * Turns `@/lib/architecture` into building geometry. Imports nothing from
 * `three`, so the whole city can be computed and checked without a renderer.
 *
 * The rules, and there are only three:
 *
 *   floors        = the layers a project documents
 *   floor width   = how many modules that layer has
 *   plinth        = the deployment targets, where any are documented
 *
 * Nothing is aggregated into a score, so there is no "biggest" project. A
 * building is tall because its project has many layers, and wide at a given
 * floor because that layer has many parts. The gesture project has no
 * interface floor because it documents none.
 *
 * @example
 * import { getCityLayout } from "./city";
 *
 * const { buildings } = getCityLayout();
 */

import {
  architectures,
  cityOrder,
  deployments,
  type ArchitectureLayer,
  type ArchitectureModule,
  type BuildingForm,
  type LayerKind,
} from "@/lib/architecture";
import { projectNames } from "@/lib/projects";
import type { ProjectId } from "@/lib/projects";

/** A point in world space. */
export type Vec3 = readonly [number, number, number];

/**
 * A window bay on a facade.
 *
 * `module` is what makes the lighting mean something. A bay on a long
 * facade is one documented module of that layer — the same fact the
 * floor's width already encodes, drawn at a smaller scale. A bay on a
 * short facade is articulation, filled at the same spacing so the building
 * does not read as a blank slab. Only the first kind is ever lit, so a lit
 * window is a part of the system and a dark one is just a wall.
 */
export interface Bay {
  readonly position: Vec3;
  /** Rotation about Y that turns the quad to face out of its wall. */
  readonly rotationY: number;
  /** True when this bay stands for a documented module. */
  readonly module: boolean;
  /** Index of the module this bay stands for, or -1. Drives the stagger. */
  readonly moduleIndex: number;
}

/** One floor of a building. */
export interface Floor {
  readonly id: string;
  readonly label: string;
  readonly kind: LayerKind;
  /** Centre of the floor slab. */
  readonly position: Vec3;
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  /** The parts of this layer, each carrying the line it was derived from. */
  readonly modules: readonly ArchitectureModule[];
  /** Lit windows on this floor: one column per module, stacked in rows. */
  readonly bays: readonly Bay[];
  /** Pipeline stages this floor implements. */
  readonly stages: readonly string[];
}

/** A generated building. */
export interface Building {
  readonly id: ProjectId;
  readonly name: string;
  readonly form: BuildingForm;
  /** Footprint centre on the ground plane. */
  readonly origin: Vec3;
  readonly floors: readonly Floor[];
  /** The deployment plinth, when the project documents one. */
  readonly plinth: {
    readonly width: number;
    readonly depth: number;
    readonly height: number;
    readonly labels: readonly string[];
  } | null;
  /** Total height, for label placement and camera framing. */
  readonly height: number;
  /** Widest footprint, for spacing and hit testing. */
  readonly footprint: number;
}

/** A length of kerb drawn on the ground. */
export interface Kerb {
  readonly from: Vec3;
  readonly to: Vec3;
}

/** A laid-out city. */
export interface CityLayout {
  readonly buildings: readonly Building[];
  /** Kerb lines of the street the buildings stand on. */
  readonly kerbs: readonly Kerb[];
  /** Dashes down the middle of the main street. */
  readonly centreLine: readonly Kerb[];
  /** Half-extent of the ground the buildings occupy. */
  readonly extent: number;
}

/**
 * How each form is proportioned.
 *
 * A tower stacks thin floors on a small footprint; a facility spreads wide
 * with taller floors; a control structure stays low and long. These are the
 * only aesthetic choices in the file, and they follow from the form, which
 * itself follows from the architecture.
 */
const PROPORTIONS: Record<
  BuildingForm,
  { base: number; perModule: number; floorHeight: number; depth: number }
> = {
  tower: { base: 1.2, perModule: 0.24, floorHeight: 1.25, depth: 1.7 },
  facility: { base: 1.9, perModule: 0.4, floorHeight: 0.95, depth: 2.7 },
  control: { base: 1.7, perModule: 0.34, floorHeight: 0.8, depth: 3.0 },
};

/** Window bay geometry. Rows are derived from a floor's height. */
const BAY = { width: 0.17, height: 0.3, rowPitch: 0.5, inset: 0.02 } as const;

/**
 * Lit windows for one floor.
 *
 * The long facades carry one column per module, so a layer with four parts
 * shows four bays across its front — the same fact the floor's width already
 * encodes, drawn at a smaller scale. The short facades are filled at the
 * same spacing; they are articulation, not a claim about the architecture.
 */
function bays(
  centreX: number,
  centreY: number,
  width: number,
  depth: number,
  height: number,
  moduleCount: number
): Bay[] {
  const rows = Math.max(1, Math.floor(height / BAY.rowPitch));
  const rowPitch = Math.min(BAY.rowPitch, height / (rows + 0.6));
  const out: Bay[] = [];

  const wall = (
    columns: number,
    span: number,
    toPoint: (offset: number, y: number) => Vec3,
    rotationY: number,
    isModule: boolean
  ) => {
    const usable = span - 0.34;
    if (usable <= 0 || columns <= 0) return;
    const pitch = usable / columns;
    for (let row = 0; row < rows; row += 1) {
      const y = centreY + (row - (rows - 1) / 2) * rowPitch;
      for (let column = 0; column < columns; column += 1) {
        out.push({
          position: toPoint(-usable / 2 + pitch * (column + 0.5), y),
          rotationY,
          module: isModule && column < moduleCount,
          moduleIndex: isModule && column < moduleCount ? column : -1,
        });
      }
    }
  };

  const long = Math.max(moduleCount, 1);
  const short = Math.max(1, Math.round((depth - 0.34) / ((width - 0.34) / long)));
  const halfW = width / 2 + BAY.inset;
  const halfD = depth / 2 + BAY.inset;

  wall(long, width, (offset, y) => [centreX + offset, y, halfD], 0, true);
  wall(long, width, (offset, y) => [centreX + offset, y, -halfD], Math.PI, true);
  wall(short, depth, (offset, y) => [centreX + halfW, y, offset], Math.PI / 2, false);
  wall(short, depth, (offset, y) => [centreX - halfW, y, offset], -Math.PI / 2, false);

  return out;
}

/** Height of a deployment plinth. */
const PLINTH_HEIGHT = 0.22;

/** Gap between adjacent buildings, measured between footprint edges. */
const GAP = 4.2;

/** Width of the main street. */
const ROAD_WIDTH = 3.2;

/** Width of a floor, from how many modules its layer has. */
function floorWidth(layer: ArchitectureLayer, form: BuildingForm): number {
  const { base, perModule } = PROPORTIONS[form];
  return base + layer.modules.length * perModule;
}

/**
 * Builds one project's geometry.
 *
 * @param id - Which project to build.
 * @param originX - Where its footprint sits along the street.
 */
function buildOne(id: ProjectId, originX: number): Building {
  const architecture = architectures[id];
  const proportions = PROPORTIONS[architecture.form];
  const deployment = deployments[id] ?? [];
  const hasPlinth = deployment.length > 0;

  const widths = architecture.layers.map((layer) =>
    floorWidth(layer, architecture.form)
  );
  const footprint = Math.max(...widths);

  const plinthHeight = hasPlinth ? PLINTH_HEIGHT : 0;
  let y = plinthHeight;

  const floors: Floor[] = architecture.layers.map((layer, index) => {
    const width = widths[index];
    const height = proportions.floorHeight;
    const centreY = y + height / 2;
    const floor: Floor = {
      id: layer.id,
      label: layer.label,
      kind: layer.kind,
      position: [originX, centreY, 0],
      width,
      depth: proportions.depth,
      height,
      modules: layer.modules,
      stages: layer.stages,
      bays: bays(
        originX,
        centreY,
        width,
        proportions.depth,
        height,
        layer.modules.length
      ),
    };
    y += height;
    return floor;
  });

  return {
    id,
    name: projectNames[id],
    form: architecture.form,
    origin: [originX, 0, 0],
    floors,
    plinth: hasPlinth
      ? {
          width: footprint + 0.55,
          depth: proportions.depth + 0.55,
          height: PLINTH_HEIGHT,
          labels: deployment,
        }
      : null,
    height: y,
    footprint,
  };
}

/**
 * Lays the city out along a single street, centred on the origin.
 *
 * Spacing is driven by each building's own footprint rather than a fixed
 * pitch, so a wide facility gets the room it needs without pushing the
 * others off centre.
 *
 * @returns Every building, placed, and the ground's half-extent.
 */
export function getCityLayout(): CityLayout {
  // Measure first so the row can be centred on its true width.
  const footprints = cityOrder.map((id) => {
    const architecture = architectures[id];
    return Math.max(
      ...architecture.layers.map((layer) => floorWidth(layer, architecture.form))
    );
  });

  const totalWidth =
    footprints.reduce((sum, width) => sum + width, 0) +
    GAP * (footprints.length - 1);

  let cursor = -totalWidth / 2;
  const buildings = cityOrder.map((id, index) => {
    const width = footprints[index];
    const centre = cursor + width / 2;
    cursor += width + GAP;
    return buildOne(id, centre);
  });

  // The street the buildings face. Its kerbs follow the deepest footprint,
  // so the road is laid out around the city rather than guessed at.
  const deepest = Math.max(
    ...buildings.map((building) =>
      Math.max(...building.floors.map((floor) => floor.depth))
    )
  );
  const roadNear = deepest / 2 + 1.5;
  const roadFar = roadNear + ROAD_WIDTH;
  const runFrom = -totalWidth / 2 - 6;
  const runTo = totalWidth / 2 + 6;

  const kerbs: Kerb[] = [
    { from: [runFrom, 0, roadNear], to: [runTo, 0, roadNear] },
    { from: [runFrom, 0, roadFar], to: [runTo, 0, roadFar] },
    { from: [runFrom, 0, -roadNear], to: [runTo, 0, -roadNear] },
  ];

  // A cross street in each gap between buildings.
  for (let index = 0; index < buildings.length - 1; index += 1) {
    const left = buildings[index];
    const right = buildings[index + 1];
    const middle =
      (left.origin[0] + left.footprint / 2 + right.origin[0] - right.footprint / 2) /
      2;
    kerbs.push(
      { from: [middle - 1.1, 0, -roadNear], to: [middle - 1.1, 0, roadFar] },
      { from: [middle + 1.1, 0, -roadNear], to: [middle + 1.1, 0, roadFar] }
    );
  }

  const centreZ = (roadNear + roadFar) / 2;
  const centreLine: Kerb[] = [];
  for (let x = runFrom; x < runTo; x += 1.6) {
    centreLine.push({ from: [x, 0, centreZ], to: [x + 0.8, 0, centreZ] });
  }

  return { buildings, kerbs, centreLine, extent: totalWidth / 2 };
}
