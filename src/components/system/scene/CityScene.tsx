/**
 * Project city.
 *
 * The world: a ground plane, and one building per project generated from
 * `./city`. A perspective camera and distance fog rather than an orthographic
 * view, because the point is to stand in a place rather than read a diagram.
 *
 * Every box in here is derived, never authored. Floors are layers, floor
 * widths are module counts, plinths are deployment targets. The one visual
 * decision the scene makes on its own is which floors carry the accent: the
 * AI layer of each project, matching the single-accent rule of the 2D
 * schematic.
 *
 * Budget: no lights, no shadows, no textures, no postprocessing. Every floor
 * of every building is one instanced mesh; every edge is one of two merged
 * line sets. Four draw calls for the whole city.
 */

"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { pipeline } from "@/lib/pipeline";
import type { ProjectId } from "@/lib/projects";
import {
  getCityLayout,
  type Building,
  type CityLayout,
  type Floor,
  type Kerb,
  type StageMark,
  type Vec3,
} from "./city";

/**
 * Props for the {@link CityScene} component.
 */
export interface CitySceneProps {
  /** Called once the first frame has been drawn. */
  onReady?: () => void;
}

/** Palette pulled from the design tokens. */
interface Palette {
  foreground: string;
  accent: string;
  background: string;
  faint: string;
  line: string;
  /** Solid building mass — lighter than the sky so facades read against it. */
  mass: string;
  /** A window with nothing behind it: articulation, not a documented part. */
  windowDark: string;
  /** A documented module at rest. */
  windowDim: string;
  /** A documented module on the floor being inspected. */
  windowLit: string;
  /** Kerb stone. */
  kerb: string;
}

/** Reads the token values off the document. */
function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    foreground: token("--foreground", "#e8edf2"),
    accent: token("--accent", "#8fafc4"),
    background: token("--background", "#080a0f"),
    faint: token("--faint", "#5e6975"),
    line: "#1b2430",
    mass: token("--surface", "#0b0f16"),
    /*
      Warm, against a cold sky. This is the one place the site leaves its
      steel-blue accent, and it earns it: a lit window is a documented
      module of that layer, so the warmth is carrying a fact rather than a
      mood. Dark windows are the short-facade filler, which claims nothing.
    */
    windowDark: "#161c25",
    windowDim: "#8a6f47",
    windowLit: "#ffe0a8",
    kerb: "#35414f",
  };
}

/**
 * A pipeline stage's display label, from its id.
 *
 * Read from the same `pipeline` the Hero's rail is drawn from, so a floor
 * and the stage it implements can never end up named differently.
 */
function stageLabel(id: string): string {
  return pipeline.stages.find((stage) => stage.id === id)?.label ?? id;
}

/** Camera limits, so the world can be explored but never broken. */
const ORBIT = {
  /** Close enough to stand between the buildings. */
  minRadius: 3,
  /** Far enough to see the whole skyline. */
  maxRadius: 70,
  minPolar: 0.1,
  /** Just under the horizon, so the camera can sit at street level. */
  maxPolar: 1.58,
} as const;

/**
 * TRACK: the world opens by pulling back, not by cutting.
 *
 * It starts where the Hero left off — close and looking down on the
 * pipeline, which is the same reading the schematic gives — and then
 * retreats and drops to street level until the buildings that stand on
 * those stages are what fills the frame. The visitor is not moved to a
 * second place; they are moved away from the first one until the larger
 * thing is visible.
 *
 * Under reduced motion the camera starts at the end of that move, because
 * the destination is the content and the travel is not.
 */
const INTRO = {
  duration: 2.1,
  from: {
    azimuth: 0.06,
    polar: 0.3,
    radius: 13.5,
    target: new THREE.Vector3(0, 0, 2.2),
  },
  to: {
    azimuth: 0.44,
    polar: 1.5,
    radius: 16.5,
    target: new THREE.Vector3(0, 1.6, 0),
  },
} as const;

/** Ease in and out, so the pull-back starts and settles rather than slides. */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function mix(from: number, to: number, k: number): number {
  return from + (to - from) * k;
}

// ─── Ground ──────────────────────────────────────────────────────────────────

/** Kerbs and lane markings, built from the layout's own street. */
function Road({
  kerbs,
  kerbColor,
}: {
  kerbs: readonly Kerb[];
  kerbColor: string;
}): React.ReactElement {
  const build = (segments: readonly Kerb[]) => {
    const points: number[] = [];
    for (const segment of segments) {
      points.push(segment.from[0], 0.01, segment.from[2]);
      points.push(segment.to[0], 0.01, segment.to[2]);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    return geometry;
  };

  const kerbGeometry = useMemo(() => build(kerbs), [kerbs]);

  return (
    <lineSegments geometry={kerbGeometry} raycast={() => null}>
      <lineBasicMaterial color={kerbColor} transparent opacity={0.75} fog />
    </lineSegments>
  );
}

/**
 * The ground: the same 64px grid the page draws behind its content, extended
 * to the horizon and faded out by fog.
 */
function Ground({ color }: { color: string }): React.ReactElement {
  const geometry = useMemo(() => {
    const half = 110;
    const step = 2.4;
    const points: number[] = [];
    for (let i = -half; i <= half; i += step) {
      points.push(-half, 0, i, half, 0, i);
      points.push(i, 0, -half, i, 0, half);
    }
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    return buffer;
  }, []);

  return (
    <lineSegments geometry={geometry} raycast={() => null}>
      <lineBasicMaterial color={color} transparent opacity={0.5} fog />
    </lineSegments>
  );
}

// ─── Buildings ───────────────────────────────────────────────────────────────

/**
 * One box to be instanced: a floor or a plinth.
 *
 * Each one remembers what it was generated from, so a pick can be traced
 * straight back to the architecture it came from. The instanced mesh hands
 * back an index; this is what that index means.
 */
interface Box {
  position: [number, number, number];
  size: [number, number, number];
  accent: boolean;
  building: ProjectId;
  /** The floor this box is, or null when it is the deployment plinth. */
  floor: Floor | null;
}

/** Flattens the city into boxes, keeping AI floors separate for the accent. */
function collectBoxes(buildings: readonly Building[]): Box[] {
  const boxes: Box[] = [];
  for (const building of buildings) {
    if (building.plinth) {
      boxes.push({
        position: [
          building.origin[0],
          building.plinth.height / 2,
          building.origin[2],
        ],
        size: [
          building.plinth.width,
          building.plinth.height,
          building.plinth.depth,
        ],
        accent: false,
        building: building.id,
        floor: null,
      });
    }
    for (const floor of building.floors) {
      boxes.push({
        position: [...floor.position] as [number, number, number],
        size: [floor.width, floor.height, floor.depth],
        accent: floor.kind === "ai",
        building: building.id,
        floor,
      });
    }
  }
  return boxes;
}

/** Merged wireframe for a set of boxes: one geometry, one draw call. */
function mergedEdges(boxes: readonly Box[]): THREE.BufferGeometry {
  const unit = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  const source = unit.getAttribute("position");
  const points: number[] = [];
  for (const box of boxes) {
    const [px, py, pz] = box.position;
    const [sx, sy, sz] = box.size;
    for (let i = 0; i < source.count; i += 1) {
      points.push(
        source.getX(i) * sx + px,
        source.getY(i) * sy + py,
        source.getZ(i) * sz + pz
      );
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return geometry;
}

/** How long a floor takes to light up, in seconds. */
const LIGHT_DURATION = 0.55;

/** How much of that time is spread across the columns of a floor. */
const LIGHT_STAGGER = 0.55;

/** One bay, flattened out of the layout and tagged with the floor it is on. */
interface FlatBay {
  position: Vec3;
  rotationY: number;
  module: boolean;
  /** Position of this module along its facade, 0..1, for the stagger. */
  phase: number;
  /** `building:floor`, matched against the floor being inspected. */
  key: string;
}

/**
 * Whether a bay belongs to whatever is currently being inspected.
 *
 * A key is either one floor (`building:floor`) or a whole building
 * (`building:*`) — choosing a building by name wakes all of it, choosing
 * one of its layers wakes only that.
 */
function inScope(bayKey: string, scope: string | null): boolean {
  if (!scope) return false;
  if (scope.endsWith(":*")) return bayKey.startsWith(scope.slice(0, -1));
  return bayKey === scope;
}

/** Smoothstep, so a window fades up rather than snapping on. */
function ease(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Every bay in the city, in one flat list. */
function flattenBays(layout: CityLayout): FlatBay[] {
  const out: FlatBay[] = [];
  for (const building of layout.buildings) {
    for (const floor of building.floors) {
      const columns = Math.max(floor.modules.length - 1, 1);
      for (const bay of floor.bays) {
        out.push({
          position: bay.position,
          rotationY: bay.rotationY,
          module: bay.module,
          phase: bay.module ? bay.moduleIndex / columns : 0.5,
          key: `${building.id}:${floor.id}`,
        });
      }
    }
  }
  return out;
}

/**
 * Every window in the city, as one instanced mesh.
 *
 * The lighting is the city's one piece of life, and it is not decoration:
 * a bay on a long facade stands for a documented module of that layer, so
 * the windows that come on when a floor is inspected are exactly its
 * parts, lighting left to right. The short-facade bays stay dark, because
 * they stand for nothing.
 *
 * Colour is per instance rather than per mesh, so the whole city is still
 * a single draw call while every window holds its own state. The frame
 * loop is only woken for the half second a floor takes to light.
 */
function Windows({
  layout,
  palette,
  litKey,
}: {
  layout: CityLayout;
  palette: Palette;
  /** `building:floor` of the floor being inspected, or null. */
  litKey: string | null;
}): React.ReactElement {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { invalidate } = useThree();
  const bays = useMemo(() => flattenBays(layout), [layout]);

  const tones = useMemo(
    () => ({
      dark: new THREE.Color(palette.windowDark),
      dim: new THREE.Color(palette.windowDim),
      lit: new THREE.Color(palette.windowLit),
      scratch: new THREE.Color(),
    }),
    [palette]
  );

  // Where the lights are going, and where they came from, so the floor
  // being left fades down while the floor being entered comes up.
  const fade = useRef({ t: 1, from: null as string | null, to: null as string | null });

  const paint = useCallback(
    (mesh: THREE.InstancedMesh, t: number) => {
      const { from, to } = fade.current;
      for (let index = 0; index < bays.length; index += 1) {
        const bay = bays[index];
        let on = 0;
        if (inScope(bay.key, to)) {
          on = ease(t * (1 + LIGHT_STAGGER) - bay.phase * LIGHT_STAGGER);
        } else if (inScope(bay.key, from)) {
          on = 1 - ease(t);
        }
        // A documented module goes dim to lit; the filler only ever hints
        // that its floor is awake.
        const base = bay.module ? tones.dim : tones.dark;
        const peak = bay.module ? tones.lit : tones.dim;
        tones.scratch.copy(base).lerp(peak, on);
        mesh.setColorAt(index, tones.scratch);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
    [bays, tones]
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    const quaternion = new THREE.Quaternion();
    const axis = new THREE.Vector3(0, 1, 0);
    for (let index = 0; index < bays.length; index += 1) {
      const bay = bays[index];
      position.set(bay.position[0], bay.position[1], bay.position[2]);
      // Facades face outward; a quad's default normal is +Z.
      quaternion.setFromAxisAngle(axis, bay.rotationY);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    // Same stale-bounds trap as the buildings. Nothing raycasts the
    // windows, but the cached sphere is what frustum culling reads too.
    mesh.computeBoundingSphere();
    mesh.computeBoundingBox();
    paint(mesh, 1);
    invalidate();
  }, [bays, paint, invalidate]);

  useEffect(() => {
    fade.current = { t: 0, from: fade.current.to, to: litKey };
    invalidate();
  }, [litKey, invalidate]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || fade.current.t >= 1) return;
    fade.current.t = Math.min(1, fade.current.t + delta / LIGHT_DURATION);
    paint(mesh, fade.current.t);
    if (fade.current.t < 1) invalidate();
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, Math.max(bays.length, 1)]}
      raycast={() => null}
    >
      <planeGeometry args={[0.17, 0.3]} />
      <meshBasicMaterial fog />
    </instancedMesh>
  );
}

/**
 * FOCUS, in the city: the inspected floor outlined in the accent.
 *
 * A unit box scaled to the floor, rather than a second merged outline set.
 * One draw call, and only while a floor is actually being looked at.
 */
function FloorHighlight({
  box,
  color,
}: {
  box: Box | null;
  color: string;
}): React.ReactElement | null {
  const { invalidate } = useThree();
  const geometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
    []
  );

  useEffect(() => invalidate(), [box, invalidate]);

  if (!box) return null;

  return (
    <lineSegments
      geometry={geometry}
      position={box.position}
      scale={box.size}
      raycast={() => null}
    >
      <lineBasicMaterial color={color} fog={false} />
    </lineSegments>
  );
}

/**
 * The pipeline the city is built on, and what each project draws from it.
 *
 * The marks are the same nine stages the Hero renders as a rail — the same
 * primitive, two scales apart. Inspecting a building lights the stages it
 * implements and draws the lines to them, which is `Floor.stages` stated
 * as geometry instead of as a caption.
 */
function GroundPipeline({
  stages,
  links,
  palette,
}: {
  stages: readonly StageMark[];
  /** Lines from the inspected building to its stages, if any. */
  links: readonly Kerb[];
  palette: Palette;
}): React.ReactElement {
  const { invalidate } = useThree();

  const rail = useMemo(() => {
    const points: number[] = [];
    for (const stage of stages) {
      points.push(stage.position[0], stage.position[1], stage.position[2]);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    return geometry;
  }, [stages]);

  const marks = useMemo(
    () =>
      mergedEdges(
        stages.map((stage) => ({
          position: [...stage.position] as [number, number, number],
          size: [stage.width, 0.04, stage.depth] as [number, number, number],
          accent: false,
          building: "ai-interview-agent" as ProjectId,
          floor: null,
        }))
      ),
    [stages]
  );

  const drawn = useMemo(() => {
    const points: number[] = [];
    for (const link of links) {
      points.push(link.from[0], link.from[1], link.from[2]);
      points.push(link.to[0], link.to[1], link.to[2]);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    return geometry;
  }, [links]);

  useEffect(() => invalidate(), [links, invalidate]);

  return (
    <group>
      <primitive
        object={useMemo(
          () =>
            new THREE.Line(
              rail,
              new THREE.LineBasicMaterial({
                color: palette.kerb,
                transparent: true,
                opacity: 0.8,
                fog: true,
              })
            ),
          [rail, palette.kerb]
        )}
      />
      <lineSegments geometry={marks} raycast={() => null}>
        <lineBasicMaterial
          color={palette.foreground}
          transparent
          opacity={0.35}
          fog
        />
      </lineSegments>
      {links.length > 0 && (
        <lineSegments geometry={drawn} raycast={() => null}>
          <lineBasicMaterial
            color={palette.accent}
            transparent
            opacity={0.55}
            fog
          />
        </lineSegments>
      )}
    </group>
  );
}

/** Every building in the city, as four draw calls. */
function Buildings({
  layout,
  palette,
  onPick,
  onOpen,
}: {
  layout: CityLayout;
  palette: Palette;
  /** Called with the box under the pointer, or null when it leaves. */
  onPick: (box: Box | null) => void;
  /** Called with the box that was clicked, to open its detail. */
  onOpen: (box: Box | null) => void;
}): React.ReactElement {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const boxes = useMemo(() => collectBoxes(layout.buildings), [layout]);
  const plainEdges = useMemo(
    () => mergedEdges(boxes.filter((box) => !box.accent)),
    [boxes]
  );
  const accentEdges = useMemo(
    () => mergedEdges(boxes.filter((box) => box.accent)),
    [boxes]
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    for (let index = 0; index < boxes.length; index += 1) {
      const box = boxes[index];
      position.set(box.position[0], box.position[1], box.position[2]);
      scale.set(box.size[0], box.size[1], box.size[2]);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    /*
     * Recompute the bounds, and not as a precaution.
     *
     * An InstancedMesh is constructed with its instance matrices zeroed,
     * and three derives the bounding volumes from them lazily and then
     * caches the result. Writing the real matrices afterwards does not
     * invalidate that cache, so the mesh keeps a degenerate sphere sitting
     * at the origin — and `InstancedMesh.raycast` tests that sphere before
     * it tests any instance. Picking then works only for the instances
     * that happen to fall inside it, which is why the middle building's
     * lowest floors responded and nothing else in the city did.
     */
    mesh.computeBoundingSphere();
    mesh.computeBoundingBox();
  }, [boxes]);

  return (
    <group>
      {/*
        The one object in the city that can be hit. Picking here is done by
        raycasting rather than by DOM boxes over the canvas, which is the
        opposite of the Hero's choice and for a concrete reason: the camera
        orbits and the buildings occlude each other, so a screen rectangle
        would happily report a floor that is standing behind another
        building. A ray does not. The cost is one raycast per pointer move
        against a single instanced mesh, because every other object in the
        scene opts out.
      */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, boxes.length]}
        onPointerMove={(event) => {
          event.stopPropagation();
          const index = event.instanceId;
          onPick(index === undefined ? null : (boxes[index] ?? null));
        }}
        onPointerOut={() => onPick(null)}
        onClick={(event) => {
          event.stopPropagation();
          const index = event.instanceId;
          onOpen(index === undefined ? null : (boxes[index] ?? null));
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={palette.mass} fog />
      </instancedMesh>
      <lineSegments geometry={plainEdges} raycast={() => null}>
        <lineBasicMaterial
          color={palette.foreground}
          transparent
          opacity={0.42}
          fog
        />
      </lineSegments>
      <lineSegments geometry={accentEdges} raycast={() => null}>
        <lineBasicMaterial color={palette.accent} fog />
      </lineSegments>
    </group>
  );
}

// ─── Camera ──────────────────────────────────────────────────────────────────

/**
 * Orbit state shared between the pointer handlers and the frame loop.
 * Kept in a ref so dragging never triggers a React render.
 */
interface OrbitState {
  azimuth: number;
  polar: number;
  radius: number;
  /** What the camera is looking at. The intro moves it; dragging does not. */
  target: THREE.Vector3;
}

/**
 * Drives the camera from the orbit state and keeps the building labels
 * pinned to their buildings.
 *
 * Both jobs are done imperatively inside the frame loop: projecting labels
 * through React state would re-render the tree on every pointer move.
 */
function Rig({
  orbit,
  intro,
  layout,
  labelRefs,
  stageRefs,
  onReady,
}: {
  orbit: React.RefObject<OrbitState>;
  /** Progress of the opening pull-back, 0 to 1. */
  intro: React.RefObject<{ t: number }>;
  layout: CityLayout;
  labelRefs: React.RefObject<(HTMLElement | null)[]>;
  /** Stage names on the rail, pinned the same way the building names are. */
  stageRefs: React.RefObject<(HTMLElement | null)[]>;
  onReady?: () => void;
}): null {
  const { camera, size, invalidate } = useThree();
  const anchors = useMemo(
    () =>
      layout.buildings.map(
        (building) =>
          new THREE.Vector3(
            building.origin[0],
            building.height + 0.55,
            building.origin[2]
          )
      ),
    [layout]
  );
  const stageAnchors = useMemo(
    () =>
      layout.stages.map(
        (stage) =>
          new THREE.Vector3(stage.position[0], 0.18, stage.position[2])
      ),
    [layout]
  );

  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      invalidate();
      onReady?.();
    }
  }, [size.width, size.height, invalidate, onReady]);

  useFrame((_, delta) => {
    /*
     * Both the camera and the label elements are mutated directly here, and
     * deliberately: they are `three` and DOM objects, and routing a pointer
     * drag through React state would re-render the tree every frame. The
     * compiler's immutability rule cannot see that, so it is waived for the
     * body of the loop.
     */
    /* eslint-disable react-hooks/immutability */
    const state = orbit.current;

    // The pull-back drives the same orbit state a drag would, so taking
    // hold of the world mid-move simply continues from wherever it is.
    if (intro.current.t < 1) {
      intro.current.t = Math.min(1, intro.current.t + delta / INTRO.duration);
      const k = easeInOut(intro.current.t);
      state.azimuth = mix(INTRO.from.azimuth, INTRO.to.azimuth, k);
      state.polar = mix(INTRO.from.polar, INTRO.to.polar, k);
      state.radius = mix(INTRO.from.radius, INTRO.to.radius, k);
      state.target.lerpVectors(INTRO.from.target, INTRO.to.target, k);
      invalidate();
    }

    const sinPolar = Math.sin(state.polar);
    camera.position.set(
      state.target.x + state.radius * sinPolar * Math.sin(state.azimuth),
      state.target.y + state.radius * Math.cos(state.polar),
      state.target.z + state.radius * sinPolar * Math.cos(state.azimuth)
    );
    camera.lookAt(state.target);
    // `lookAt` leaves `matrixWorldInverse` stale, and that is the matrix
    // `project()` reads. Without this the labels are pinned to where the
    // camera was on the previous frame, which in demand mode is wherever it
    // last stopped.
    camera.updateMatrixWorld();

    const pin = (
      nodes: (HTMLElement | null)[] | null,
      points: THREE.Vector3[],
      anchor: string
    ) => {
      if (!nodes) return;
      for (let index = 0; index < points.length; index += 1) {
        const node = nodes[index];
        if (!node) continue;
        const projected = points[index].clone().project(camera);
        const x = ((projected.x + 1) / 2) * size.width;
        const y = ((1 - projected.y) / 2) * size.height;
        node.style.transform = `translate3d(${x}px, ${y}px, 0) ${anchor}`;
        // `opacity` is owned by React for the stage names, which come and
        // go; only the building names are hidden from here.
        if (projected.z > 1) node.style.visibility = "hidden";
        else node.style.visibility = "visible";
      }
    };

    pin(labelRefs.current, anchors, "translate(-50%, -100%)");
    pin(stageRefs.current, stageAnchors, "translate(-50%, -50%)");
    /* eslint-enable react-hooks/immutability */
  });

  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * The project city.
 *
 * @param props - Ready callback.
 * @returns The canvas and its building labels.
 */
export default function CityScene({ onReady }: CitySceneProps): React.ReactElement {
  const layout = useMemo(() => getCityLayout(), []);
  const palette = useMemo(() => readPalette(), []);
  // What the pointer is over, and what the panel is describing. They are
  // separate because a building stays inspected while the keyboard holds
  // it, even though no floor is under the pointer.
  const [picked, setPicked] = useState<Box | null>(null);
  const [inspected, setInspected] = useState<ProjectId | null>(null);
  // A selected floor stays lit and opens its own detail; a hovered one
  // only lights. Selection wins, so moving the pointer away does not
  // close what someone deliberately opened.
  const [selected, setSelected] = useState<string | null>(null);
  const panelId = useId();

  const building = useMemo(
    () => layout.buildings.find((item) => item.id === inspected) ?? null,
    [layout, inspected]
  );

  const onOpen = useCallback((box: Box | null) => {
    if (!box) return;
    setInspected(box.building);
    setSelected(box.floor ? box.floor.id : null);
  }, []);

  const onPick = useCallback((box: Box | null) => {
    setPicked(box);
    if (box) setInspected(box.building);
  }, []);

  /**
   * What is lit. A chosen layer lights that layer; a layer under the
   * pointer lights that one; a building chosen by name lights all of it.
   */
  const litKey = useMemo(() => {
    if (selected && inspected) return `${inspected}:${selected}`;
    if (picked?.floor) return `${picked.building}:${picked.floor.id}`;
    if (inspected) return `${inspected}:*`;
    return null;
  }, [selected, inspected, picked]);

  /**
   * The stages named on the rail: those of the open layer if one is open,
   * otherwise every stage the inspected building implements.
   */
  const activeStages = useMemo(() => {
    if (!building) return new Set<string>();
    const floors = selected
      ? building.floors.filter((floor) => floor.id === selected)
      : building.floors;
    return new Set(floors.flatMap((floor) => floor.stages));
  }, [building, selected]);

  /** The floor whose detail the panel is showing. */
  const openFloor = useMemo(
    () => building?.floors.find((floor) => floor.id === selected) ?? null,
    [building, selected]
  );
  /*
   * Reduced motion is answered here rather than by withholding the world:
   * the city has no motion of its own, so the honest accommodation is to
   * skip the travel and start at the destination, not to deny the content.
   * Read at first render, which is safe because this scene is client only.
   */
  const settled =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = settled ? INTRO.to : INTRO.from;
  const orbit = useRef<OrbitState>({
    azimuth: start.azimuth,
    polar: start.polar,
    radius: start.radius,
    target: start.target.clone(),
  });
  const intro = useRef({ t: settled ? 1 : 0 });
  const labelRefs = useRef<(HTMLElement | null)[]>([]);
  const stageRefs = useRef<(HTMLElement | null)[]>([]);
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);

  const nudge = useCallback(() => invalidateRef.current?.(), []);

  /** Taking hold of the world ends the opening move wherever it has got to. */
  const takeOver = useCallback(() => {
    intro.current.t = 1;
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      takeOver();
      dragging.current = { x: event.clientX, y: event.clientY };
      (event.target as Element).setPointerCapture?.(event.pointerId);
    },
    [takeOver]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const from = dragging.current;
      if (!from) return;
      takeOver();
      const state = orbit.current;
      state.azimuth -= (event.clientX - from.x) * 0.006;
      state.polar = Math.min(
        ORBIT.maxPolar,
        Math.max(ORBIT.minPolar, state.polar - (event.clientY - from.y) * 0.004)
      );
      dragging.current = { x: event.clientX, y: event.clientY };
      nudge();
    },
    [nudge, takeOver]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const onWheel = useCallback(
    (event: React.WheelEvent) => {
      takeOver();
      const state = orbit.current;
      state.radius = Math.min(
        ORBIT.maxRadius,
        Math.max(ORBIT.minRadius, state.radius + event.deltaY * 0.02)
      );
      nudge();
    },
    [nudge, takeOver]
  );

  // Arrow keys orbit too, so the world is reachable without a pointer.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const state = orbit.current;
      takeOver();
      if (event.key === "ArrowLeft") state.azimuth += 0.09;
      else if (event.key === "ArrowRight") state.azimuth -= 0.09;
      else if (event.key === "ArrowUp")
        state.polar = Math.max(ORBIT.minPolar, state.polar - 0.06);
      else if (event.key === "ArrowDown")
        state.polar = Math.min(ORBIT.maxPolar, state.polar + 0.06);
      else return;
      event.preventDefault();
      nudge();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nudge, takeOver]);

  return (
    <div
      className="relative h-full w-full touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
    >
      <Canvas
        camera={{ fov: 46, position: [8, 4, 17], near: 0.1, far: 260 }}
        dpr={[1, 1.75]}
        frameloop="demand"
        gl={{ antialias: true, powerPreference: "low-power" }}
        onCreated={({ invalidate }) => {
          invalidateRef.current = invalidate;
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={[palette.background]} />
        <fog attach="fog" args={[palette.background, 26, 130]} />
        <Rig
          orbit={orbit}
          intro={intro}
          layout={layout}
          labelRefs={labelRefs}
          stageRefs={stageRefs}
          onReady={onReady}
        />
        <Ground color={palette.line} />
        <Road kerbs={layout.kerbs} kerbColor={palette.kerb} />
        <GroundPipeline
          stages={layout.stages}
          links={inspected ? layout.links[inspected] : []}
          palette={palette}
        />
        <Buildings
          layout={layout}
          palette={palette}
          onPick={onPick}
          onOpen={onOpen}
        />
        <FloorHighlight
          box={picked?.building === inspected ? picked : null}
          color={palette.accent}
        />
        <Windows layout={layout} palette={palette} litKey={litKey} />
      </Canvas>

      {/*
        Building names live in the DOM: crisp, themeable, and positioned
        imperatively by the rig so orbiting never re-renders React. The
        project cards below the fold carry the same information, so these
        are hidden from assistive technology.
      */}
      <div className="pointer-events-none absolute inset-0">
        {layout.buildings.map((item, index) => (
          <button
            key={item.id}
            type="button"
            ref={(node) => {
              labelRefs.current[index] = node;
            }}
            aria-describedby={inspected === item.id ? panelId : undefined}
            // The rig pins these to their buildings every frame, so the
            // name is also the handle: pointing at a floor inspects the
            // building, and so does tabbing to its name.
            className={cn(
              "pointer-events-auto absolute left-0 top-0 whitespace-nowrap font-mono text-small",
              inspected === item.id ? "text-accent" : "text-foreground"
            )}
            // Hidden until the rig has pinned it, so it never flashes at
            // the top-left corner on the first frame. `visibility` is the
            // rig's to set from here on; `opacity` stays React's.
            style={{ visibility: "hidden" }}
            onPointerDown={(event) => event.stopPropagation()}
            // Deliberately no onBlur. Focus moves *into* the panel the
            // moment a layer is chosen, and clearing the building there
            // would unmount the very panel being reached for. An inspector
            // stays open until something else is inspected.
            onFocus={() => {
              setInspected(item.id);
              setSelected(null);
            }}
            onClick={() => {
              setInspected(item.id);
              setSelected(null);
            }}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/*
        Stage names on the rail. All nine exist so the rig can pin them
        without the refs shifting, but only the ones the inspected building
        actually implements are shown — at rest the street stays quiet, and
        asking about a building is what makes its part of the system speak.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {layout.stages.map((stage, index) => (
          <span
            key={stage.id}
            ref={(node) => {
              stageRefs.current[index] = node;
            }}
            className={cn(
              "absolute left-0 top-0 whitespace-nowrap font-mono text-[11px] transition-opacity duration-200",
              activeStages.has(stage.id)
                ? "text-accent opacity-100"
                : "opacity-0"
            )}
            style={{ visibility: "hidden" }}
          >
            {stage.label}
          </span>
        ))}
      </div>

      {building && (
        <div
          id={panelId}
          className="pointer-events-auto absolute bottom-20 left-6 w-[min(25rem,calc(100%-3rem))] rounded-md border border-line-strong bg-surface p-5 sm:left-8"
        >
          {openFloor ? (
            /*
              One floor, in full. Every module carries the line in
              Projects.tsx it was derived from — the provenance the data has
              recorded since fe19778 and nothing has ever shown.
            */
            <>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="eyebrow text-muted-foreground transition-colors hover:text-accent"
              >
                <span aria-hidden="true">←</span> {building.name}
              </button>

              <p
                className={cn(
                  "mt-3 font-mono text-h3",
                  openFloor.kind === "ai" ? "text-accent" : "text-foreground"
                )}
              >
                {openFloor.label}
              </p>
              <p className="mt-1 text-[11px] text-faint">
                {`${openFloor.modules.length} ${
                  openFloor.modules.length === 1 ? "part" : "parts"
                } · ${openFloor.modules.length === 1 ? "one lit window" : "one lit window each"}`}
              </p>

              <ul className="mt-4 flex flex-col gap-3">
                {openFloor.modules.map((module) => (
                  <li key={module.label}>
                    <p className="font-mono text-[12px] text-foreground">
                      {module.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {module.source}
                    </p>
                  </li>
                ))}
              </ul>

              {openFloor.stages.length > 0 && (
                <p className="mt-4 border-t border-line pt-3 text-[11px] text-faint">
                  {`Implements ${openFloor.stages.map(stageLabel).join(", ")}`}
                </p>
              )}
            </>
          ) : (
            /* The building at a glance: what it stands on, and its layers. */
            <>
              <p className="eyebrow text-accent">{building.name}</p>
              {building.plinth && (
                <p className="mt-1 text-[11px] text-faint">
                  {`Deployed on ${building.plinth.labels.join(", ")}`}
                </p>
              )}

              {/*
                Floors top down, the way a tower is read rather than the way
                it is stacked. Each row is also the keyboard route into that
                floor, so the world is not pointer-only.
              */}
              <ul className="mt-4 flex flex-col-reverse gap-1">
                {building.floors.map((floor) => (
                  <li key={floor.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(floor.id)}
                      onPointerEnter={() =>
                        setPicked({
                          position: [...floor.position] as [number, number, number],
                          size: [floor.width, floor.height, floor.depth],
                          accent: floor.kind === "ai",
                          building: building.id,
                          floor,
                        })
                      }
                      className={cn(
                        "w-full border-l py-1 pl-3 text-left transition-colors",
                        picked?.floor?.id === floor.id &&
                          picked.building === building.id
                          ? "border-accent"
                          : "border-line hover:border-line-strong"
                      )}
                    >
                      <span
                        className={cn(
                          "block font-mono text-[11px]",
                          floor.kind === "ai" ? "text-accent" : "text-foreground"
                        )}
                      >
                        {floor.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                        {floor.modules.map((module) => module.label).join(" · ")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <p className="mt-4 border-t border-line pt-3 text-[11px] text-faint">
                Select a layer to see what each part came from
              </p>
            </>
          )}
        </div>
      )}

    </div>
  );
}
