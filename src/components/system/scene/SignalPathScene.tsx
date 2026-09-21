/**
 * Signal Path scene.
 *
 * The 3D rendering of the pipeline, reading the same data as the 2D
 * schematic through `./layout`. It draws the composition, the camera, the
 * labels, and FLOW — the one continuous animation on the site. Stage
 * inspection (FOCUS) comes later.
 *
 * What the composition says, and why depth is not decoration:
 *
 * - Stages are horizontal slabs on an axonometric ground plane. A slab is
 *   the primitive a project building will later be stacked from, so the
 *   Hero and the project city are the same object at two scales.
 * - The build phase sits *behind* the request path, because that is when it
 *   runs: once, ahead of time, feeding the line a query travels.
 * - The corpus is a lattice set further back and below, and retrieval
 *   reaches into it and returns a handful of marks. That reach is the one
 *   thing a flat diagram cannot show.
 * - FLOW travels the request path only, and never the build path. The
 *   phase headers already claim the build half runs once and the request
 *   half runs per query; a signal crossing all nine stages would contradict
 *   the drawing it sits in. So the build rail stays still because it has
 *   already run, and each pass of the mark is one query.
 *
 * Loaded only via `next/dynamic` with `ssr: false`, so `three` and
 * `@react-three/fiber` stay out of the initial bundle. No `drei`: the scene
 * needs lines, boxes and a projection, and avoiding it keeps
 * `troika-three-text` and `three-stdlib` out of the chunk.
 *
 * Budget: no lights, no shadows, no textures, no postprocessing, flat
 * `MeshBasicMaterial` only. The frame loop runs on demand and only rises
 * to a continuous loop while FLOW is actually running — which is to say
 * while the band is on screen and the tab is in front. Under reduced
 * motion the scene is never mounted at all, so FLOW cannot start.
 */

"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  getPhaseGroups,
  pipeline,
  type PipelinePhaseId,
  type PipelineStage,
} from "@/lib/pipeline";
import { projectNames } from "@/lib/projects";
import { cn } from "@/lib/utils";
import {
  getSceneLayout,
  type SceneLayout,
  type StageNode,
  type Vec3,
} from "./layout";

/**
 * Props for the {@link SignalPathScene} component.
 */
export interface SignalPathSceneProps {
  /** Called once the renderer exists and the first frame has been drawn. */
  onReady?: () => void;
  /**
   * Whether FLOW should run. False parks the signal and drops the renderer
   * back to drawing on demand, so an off-screen or backgrounded band costs
   * nothing.
   */
  active?: boolean;
}

/** A stage label placed in the DOM, in percentages of the canvas box. */
interface ProjectedLabel {
  id: string;
  label: string;
  ordinal: string;
  x: number;
  y: number;
  /** True when the label hangs below its slab rather than sitting above it. */
  below: boolean;
  /**
   * The box a pointer has to be inside to inspect this stage, covering the
   * slab and its label. In canvas percentages, like everything else here —
   * FOCUS is picked in the DOM rather than by raycasting the scene, so the
   * renderer never has to run a raycaster on pointer move and the stages
   * are reachable by keyboard without any extra work.
   */
  hit: { left: number; top: number; width: number; height: number };
}

/**
 * A phase header, and the divider that opens it. The 2D schematic names
 * both halves of the lifecycle and marks where one becomes the other; the
 * scene would be a step backwards from its own fallback without them.
 */
interface ProjectedPhase {
  id: string;
  /** e.g. `"BUILD · INDEXED ONCE"`. */
  text: string;
  /** Centre of the header over the phase's own stages. */
  x: number;
  /** Where this phase begins. Null for the first one, which opens the flow. */
  dividerX: number | null;
}

/** One pass of the framing, handed to the DOM label layer. */
interface Projection {
  stages: ProjectedLabel[];
  phases: ProjectedPhase[];
}

/** Palette pulled from the design tokens, so the scene cannot drift. */
interface ScenePalette {
  foreground: string;
  accent: string;
  background: string;
  faint: string;
}

/** Dimensions of a stage slab. */
const SLAB = { width: 0.92, depth: 0.66, height: 0.07 } as const;

/** Size of one mark in the corpus lattice. */
const MARK = 0.12;

/**
 * FLOW: the travelling signal, in seconds and world units.
 *
 * One pass is one query. The gap between passes is what makes them read
 * as separate requests rather than a conveyor belt, and the fade keeps the
 * mark from popping in and out at the ends of the run.
 */
const FLOW = {
  /** Time for one query to cross the request path. */
  travel: 3.4,
  /** Quiet time between one query and the next. */
  gap: 1.1,
  /** Fade in and out over this fraction of the run. */
  fade: 0.12,
  /** Size of the mark. Elongated along the flow axis, so it reads as travel. */
  size: [0.3, 0.022, 0.15] as const,
  /** Height above the slab tops, so the mark rides the rail visibly. */
  lift: SLAB.height / 2 + 0.02,
} as const;

/**
 * How far a label is anchored from its slab, in world units.
 *
 * The request row carries its labels above; the build row hangs them
 * below. That is not a stylistic alternation — the corpus lattice sits
 * behind the build row, and "behind" is "higher up the screen" here, so a
 * label lifted above a build slab lands inside the lattice. Dropping them
 * puts them in the empty band between the two rows, where the two rows'
 * stages never share an x, so nothing collides either way.
 */
const LABEL_LIFT = 0.46;
const LABEL_DROP = -0.46;

/** Signed offset from a stage's slab to its label anchor. */
function labelOffset(phase: PipelinePhaseId): number {
  return phase === "build" ? LABEL_DROP : LABEL_LIFT;
}

/** Reads the token values off the document. */
function readPalette(): ScenePalette {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    foreground: token("--foreground", "#e8edf2"),
    accent: token("--accent", "#8fafc4"),
    background: token("--background", "#080a0f"),
    faint: token("--faint", "#5e6975"),
  };
}

/** Builds a line from a flat list of points. */
function lineGeometry(points: readonly Vec3[]): THREE.BufferGeometry {
  return new THREE.BufferGeometry().setFromPoints(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
  );
}

// ─── Geometry ────────────────────────────────────────────────────────────────

/** Stage slabs: one instanced mesh for the fills, one merged set of edges. */
function Stages({
  positions,
  palette,
}: {
  positions: readonly Vec3[];
  palette: ScenePalette;
}): React.ReactElement {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    positions.forEach((position, index) => {
      matrix.setPosition(position[0], position[1], position[2]);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);

  // Every slab's edges merged into a single line geometry: one draw call for
  // the whole set of outlines rather than one per stage.
  const edges = useMemo(() => {
    const template = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(SLAB.width, SLAB.height, SLAB.depth)
    );
    const source = template.getAttribute("position");
    const points: number[] = [];
    for (const [x, y, z] of positions) {
      for (let i = 0; i < source.count; i += 1) {
        points.push(
          source.getX(i) + x,
          source.getY(i) + y,
          source.getZ(i) + z
        );
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    return geometry;
  }, [positions]);

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, positions.length]}
        raycast={() => null}
      >
        <boxGeometry args={[SLAB.width, SLAB.height, SLAB.depth]} />
        <meshBasicMaterial color={palette.background} />
      </instancedMesh>
      <lineSegments geometry={edges} raycast={() => null}>
        <lineBasicMaterial
          color={palette.foreground}
          transparent
          opacity={0.6}
        />
      </lineSegments>
    </group>
  );
}

/** The corpus lattice, and the marks a query returns from it. */
function Corpus({
  field,
  retrieved,
  palette,
}: {
  field: readonly Vec3[];
  retrieved: readonly Vec3[];
  palette: ScenePalette;
}): React.ReactElement {
  const restRef = useRef<THREE.InstancedMesh>(null);
  const hitRef = useRef<THREE.InstancedMesh>(null);

  const rest = useMemo(() => {
    const taken = new Set(retrieved.map((p) => p.join(",")));
    return field.filter((p) => !taken.has(p.join(",")));
  }, [field, retrieved]);

  useLayoutEffect(() => {
    const restMesh = restRef.current;
    if (restMesh) {
      const matrix = new THREE.Matrix4();
      for (let index = 0; index < rest.length; index += 1) {
        const point = rest[index];
        matrix.setPosition(point[0], point[1], point[2]);
        restMesh.setMatrixAt(index, matrix);
      }
      restMesh.instanceMatrix.needsUpdate = true;
    }

    const hitMesh = hitRef.current;
    if (hitMesh) {
      const matrix = new THREE.Matrix4();
      for (let index = 0; index < retrieved.length; index += 1) {
        const point = retrieved[index];
        matrix.setPosition(point[0], point[1], point[2]);
        hitMesh.setMatrixAt(index, matrix);
      }
      hitMesh.instanceMatrix.needsUpdate = true;
    }
  }, [rest, retrieved]);

  return (
    <group>
      <instancedMesh
        ref={restRef}
        args={[undefined, undefined, rest.length]}
        raycast={() => null}
      >
        <boxGeometry args={[MARK, 0.012, MARK]} />
        <meshBasicMaterial color={palette.faint} transparent opacity={0.5} />
      </instancedMesh>
      <instancedMesh
        ref={hitRef}
        args={[undefined, undefined, retrieved.length]}
        raycast={() => null}
      >
        <boxGeometry args={[MARK * 1.35, 0.02, MARK * 1.35]} />
        <meshBasicMaterial color={palette.accent} />
      </instancedMesh>
    </group>
  );
}

/** A set of hairlines drawn from a flat list of segment endpoints. */
function Segments({
  points,
  color,
  opacity,
}: {
  points: readonly Vec3[];
  color: string;
  opacity: number;
}): React.ReactElement {
  const geometry = useMemo(() => lineGeometry(points), [points]);
  return (
    <lineSegments geometry={geometry} raycast={() => null}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
}

/**
 * FLOW: one query crossing the request path.
 *
 * Driven from the frame loop rather than React state — the mark moves every
 * frame, and routing that through a render would rebuild the tree sixty
 * times a second for a single matrix update.
 *
 * It travels the request stages only. They share a depth and an even
 * spacing, so the run is a straight line along the flow axis and the
 * position is a single interpolation rather than a walk along a polyline.
 */
function Signal({
  nodes,
  color,
  active,
}: {
  nodes: readonly StageNode[];
  color: string;
  active: boolean;
}): React.ReactElement | null {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const elapsed = useRef(0);
  const { invalidate } = useThree();

  const run = useMemo(() => {
    const request = nodes.filter((node) => node.phase === "request");
    const first = request[0];
    const last = request[request.length - 1];
    return first && last ? { first, last } : null;
  }, [nodes]);

  // Parking the signal is a state change of its own: without it the mark
  // freezes mid-rail the moment the band leaves the screen, and is still
  // sitting there when it comes back.
  useEffect(() => {
    if (active) return;
    elapsed.current = 0;
    const mesh = meshRef.current;
    if (mesh) mesh.visible = false;
    invalidate();
  }, [active, invalidate]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material || !run || !active) return;

    // The mesh and its material are `three` objects, mutated in place every
    // frame — that is how react-three-fiber is meant to be driven.
    //
    // Clamped so a long frame — a backgrounded tab handing back a delta of
    // several seconds — advances one step rather than teleporting.
    elapsed.current =
      (elapsed.current + Math.min(delta, 0.1)) % (FLOW.travel + FLOW.gap);

    const progress = elapsed.current / FLOW.travel;
    if (progress > 1) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    const [fromX, y, z] = run.first.position;
    const toX = run.last.position[0];
    mesh.position.set(
      fromX + (toX - fromX) * progress,
      y + FLOW.lift,
      z
    );
    material.opacity = Math.min(
      1,
      progress / FLOW.fade,
      (1 - progress) / FLOW.fade
    );
  });

  if (!run) return null;

  return (
    <mesh ref={meshRef} visible={false} raycast={() => null}>
      <boxGeometry args={[...FLOW.size]} />
      <meshBasicMaterial ref={materialRef} color={color} transparent />
    </mesh>
  );
}

/**
 * FOCUS, in the scene: the inspected stage outlined in the accent.
 *
 * A single slab's worth of edges, moved to whichever stage is being looked
 * at, rather than a second copy of the merged outline set. One draw call,
 * and only while something is actually focused.
 */
function Highlight({
  node,
  color,
}: {
  node: StageNode | null;
  color: string;
}): React.ReactElement | null {
  const { invalidate } = useThree();
  const geometry = useMemo(
    () =>
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(SLAB.width, SLAB.height, SLAB.depth)
      ),
    []
  );

  // FLOW keeps the loop running whenever the band is on screen, so this is
  // belt and braces — but a focus change has to be drawn even if the loop
  // happens to be standing down.
  useEffect(() => invalidate(), [node, invalidate]);

  if (!node) return null;

  return (
    <lineSegments
      geometry={geometry}
      position={[...node.position]}
      raycast={() => null}
    >
      <lineBasicMaterial color={color} />
    </lineSegments>
  );
}

/**
 * The rail: one continuous line through every stage.
 *
 * Built as a `THREE.Line` and mounted through `primitive` because the JSX
 * intrinsic for it collides with SVG's `<line>`.
 */
function Rail({
  points,
  color,
}: {
  points: readonly Vec3[];
  color: string;
}): React.ReactElement {
  const object = useMemo(() => {
    const line = new THREE.Line(
      lineGeometry(points),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 })
    );
    line.raycast = () => null;
    return line;
  }, [points, color]);

  return <primitive object={object} />;
}

// ─── Framing and projection ──────────────────────────────────────────────────

/**
 * Where the camera stands, and how much room is kept around the drawing.
 *
 * The band is roughly five times wider than it is tall, so height is what
 * the fit runs out of first — and the corpus, set three units behind the
 * rail, is most of what fills it. The elevation is therefore shallow
 * enough to keep the whole composition within that height at a zoom where
 * adjacent stage labels still clear each other, and steep enough that a
 * slab still reads as a plate rather than a line.
 */
const CAMERA = { position: [0, 9, 11] as const, target: [0, 0, -0.6] as const };

/** World-unit breathing room kept around the drawing when fitting it. */
const PADDING = { x: 0.7, top: 0.95, bottom: 0.35 } as const;

/**
 * Every point the framing has to keep inside the band.
 *
 * The flow's width alone is not enough. The corpus sits well behind the
 * rail, and in this projection "behind" reads as "higher up the screen",
 * so fitting on width pushes the lattice out through the top of the band.
 */
function framingPoints(layout: SceneLayout): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const halfWidth = SLAB.width / 2;
  const halfDepth = SLAB.depth / 2;

  for (const node of layout.nodes) {
    const [x, y, z] = node.position;
    for (const dx of [-halfWidth, halfWidth]) {
      for (const dz of [-halfDepth, halfDepth]) {
        points.push(new THREE.Vector3(x + dx, y, z + dz));
      }
    }
    // The label has to be framed with its slab, on whichever side it sits.
    points.push(new THREE.Vector3(x, y + labelOffset(node.phase), z));
  }

  for (const [x, y, z] of layout.field) {
    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

/**
 * Frames the layout and reports where each stage lands on screen.
 *
 * The camera is orthographic and fixed, so the projection only has to be
 * recomputed when the canvas is resized. Labels are then plain DOM, which
 * keeps them crisp, themeable and out of the WebGL budget.
 */
function Framing({
  layout,
  onProject,
  onReady,
}: {
  layout: SceneLayout;
  onProject: (projection: Projection) => void;
  onReady?: () => void;
}): null {
  const { camera, size, invalidate } = useThree();

  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;

    // The camera is a `three` object, and framing it means mutating it —
    // that is how react-three-fiber is meant to be driven. The compiler's
    // immutability rule cannot see that, so it is waived here and only here.
    /* eslint-disable react-hooks/immutability */
    const orthographic = camera as THREE.OrthographicCamera;

    // Orient first. The camera shares the target's X, so the flow axis
    // carries no roll and the rail reads level. The only tilt left in the
    // drawing is the build phase sitting behind the request path — which is
    // the one thing the depth is here to say.
    const target = new THREE.Vector3(...CAMERA.target);
    orthographic.position.set(target.x, CAMERA.position[1], CAMERA.position[2]);
    orthographic.lookAt(target);
    orthographic.updateMatrixWorld();

    // Then fit what is actually drawn, measured in the camera's own space
    // so the fit follows the projection instead of estimating it.
    const local = new THREE.Vector3();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const point of framingPoints(layout)) {
      local.copy(point).applyMatrix4(orthographic.matrixWorldInverse);
      minX = Math.min(minX, local.x);
      maxX = Math.max(maxX, local.x);
      minY = Math.min(minY, local.y);
      maxY = Math.max(maxY, local.y);
    }

    // Top padding is the deeper of the two: it is the strip the phase
    // headers occupy, above the drawing.
    const spanX = maxX - minX + PADDING.x * 2;
    const spanY = maxY - minY + PADDING.top + PADDING.bottom;
    orthographic.zoom = Math.min(size.width / spanX, size.height / spanY);

    // Recentre by sliding the camera along its own right and up axes, so
    // the measured box lands in the middle of the band.
    const right = new THREE.Vector3().setFromMatrixColumn(
      orthographic.matrixWorld,
      0
    );
    const up = new THREE.Vector3().setFromMatrixColumn(
      orthographic.matrixWorld,
      1
    );
    orthographic.position
      .addScaledVector(right, (minX + maxX) / 2)
      .addScaledVector(up, (minY + maxY + PADDING.top - PADDING.bottom) / 2);
    orthographic.updateProjectionMatrix();
    orthographic.updateMatrixWorld();
    /* eslint-enable react-hooks/immutability */

    /** World point to a percentage of the canvas box. */
    const toScreen = (x: number, y: number, z: number) => {
      const projected = new THREE.Vector3(x, y, z).project(camera);
      return {
        x: ((projected.x + 1) / 2) * 100,
        y: ((1 - projected.y) / 2) * 100,
      };
    };

    const stages = layout.nodes.map((node) => {
      // Anchor the label clear of the slab: the slab has depth, so its drawn
      // edges sit well away from its centre in screen space, and a label
      // pinned to the centre lands on top of the drawing.
      const [x, y, z] = node.position;
      const below = node.phase === "build";
      const screen = toScreen(x, y + labelOffset(node.phase), z);

      // The hit box is the slab's own drawn footprint together with its
      // label, so the target is whatever a reader would actually point at.
      const halfWidth = SLAB.width / 2;
      const halfDepth = SLAB.depth / 2;
      const spots = [screen];
      for (const dx of [-halfWidth, halfWidth]) {
        for (const dz of [-halfDepth, halfDepth]) {
          spots.push(toScreen(x + dx, y + SLAB.height / 2, z + dz));
        }
      }
      const xs = spots.map((spot) => spot.x);
      const ys = spots.map((spot) => spot.y);
      const left = Math.min(...xs);
      const top = Math.min(...ys);

      return {
        id: node.id,
        label: node.label,
        ordinal: String(node.index + 1).padStart(2, "0"),
        x: screen.x,
        y: screen.y,
        below,
        hit: {
          left,
          top,
          width: Math.max(...xs) - left,
          height: Math.max(...ys) - top,
        },
      };
    });

    // Phase headers read from the same grouping the schematic uses, so the
    // two representations cannot drift apart.
    const phases = getPhaseGroups().map((group, index) => {
      const own = layout.nodes.filter((node) => node.phase === group.phase.id);
      const centreX =
        (own[0].position[0] + own[own.length - 1].position[0]) / 2;
      return {
        id: group.phase.id,
        text: `${group.phase.label} · ${group.phase.cadence}`.toUpperCase(),
        x: toScreen(centreX, 0, 0).x,
        dividerX:
          index > 0 && layout.phaseBoundaryX !== null
            ? toScreen(layout.phaseBoundaryX, 0, 0).x
            : null,
      };
    });

    onProject({ stages, phases });
    invalidate();
    onReady?.();
  }, [camera, size.width, size.height, layout, onProject, invalidate, onReady]);

  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Static 3D rendering of the pipeline, with DOM stage labels over it.
 *
 * @param props - Ready callback.
 * @returns The canvas and its label layer.
 */
export default function SignalPathScene({
  onReady,
  active = false,
}: SignalPathSceneProps): React.ReactElement {
  const layout = useMemo(() => getSceneLayout(), []);
  const palette = useMemo(() => readPalette(), []);
  const [projection, setProjection] = useState<Projection>({
    stages: [],
    phases: [],
  });
  const [focused, setFocused] = useState<string | null>(null);
  const panelId = useId();

  const focusedNode = useMemo(
    () => layout.nodes.find((node) => node.id === focused) ?? null,
    [layout, focused]
  );
  const focusedStage: PipelineStage | undefined = useMemo(
    () => pipeline.stages.find((stage) => stage.id === focused),
    [focused]
  );
  const focusedLabel = useMemo(
    () => projection.stages.find((item) => item.id === focused) ?? null,
    [projection, focused]
  );

  // Leaving a stage must not clear a different one that has since been
  // entered — pointer-leave and blur can arrive after the next enter.
  const release = useCallback(
    (id: string) => setFocused((current) => (current === id ? null : current)),
    []
  );

  return (
    <div className="relative h-full w-full">
      {/*
        The drawing is hidden from assistive technology: it carries no text
        of its own, and the schematic underneath still holds the full
        screen-reader description of every stage.
      */}
      <div aria-hidden="true" className="absolute inset-0">
        <Canvas
        orthographic
        camera={{ position: [...CAMERA.position], zoom: 69 }}
        dpr={[1, 1.75]}
        frameloop={active ? "always" : "demand"}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        style={{ width: "100%", height: "100%" }}
      >
        <Framing layout={layout} onProject={setProjection} onReady={onReady} />
        <Rail points={layout.rail} color={palette.foreground} />
        <Stages positions={layout.rail} palette={palette} />
        <Corpus
          field={layout.field}
          retrieved={layout.retrieved}
          palette={palette}
        />
        <Segments points={layout.reach} color={palette.accent} opacity={0.4} />
        <Signal nodes={layout.nodes} color={palette.accent} active={active} />
        <Highlight node={focusedNode} color={palette.accent} />
        </Canvas>
      </div>

      {/*
        Labels are DOM, not geometry: crisp at any pixel ratio, coloured by
        the same tokens as the rest of the page, and free of the canvas
        budget. They duplicate the schematic's screen-reader list, so they
        are hidden from assistive technology.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {projection.phases.map((phase) => (
          <Fragment key={phase.id}>
            {phase.dividerX !== null && (
              <span
                className="absolute inset-y-0 border-l border-dashed border-line"
                style={{ left: `${phase.dividerX}%` }}
              />
            )}
            <span
              className="eyebrow absolute top-0 -translate-x-1/2 whitespace-nowrap text-accent"
              style={{ left: `${phase.x}%` }}
            >
              {phase.text}
            </span>
          </Fragment>
        ))}

        {projection.stages.map((item) => (
          <span
            key={item.id}
            className={cn(
              "absolute -translate-x-1/2 whitespace-nowrap text-center font-mono leading-tight transition-colors duration-[var(--motion-instant)]",
              !item.below && "-translate-y-full"
            )}
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            <span className="block text-[10px] text-faint">{item.ordinal}</span>
            <span
              className={cn(
                "block text-[13px]",
                focused === item.id ? "text-accent" : "text-foreground"
              )}
            >
              {item.label}
            </span>
          </span>
        ))}
      </div>

      {/*
        FOCUS. One button per stage, sized to the slab and its label. These
        are the scene's only interactive elements and its only exposed ones:
        a stage is inspectable by pointer and by keyboard, and the panel is
        wired as each button's description so focusing one announces what it
        reveals.
      */}
      <div
        className="absolute inset-0"
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          setFocused(null);
          (event.target as HTMLElement).blur();
        }}
      >
        {projection.stages.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-describedby={focused === item.id ? panelId : undefined}
            className="pointer-events-auto absolute rounded-sm"
            style={{
              left: `${item.hit.left}%`,
              top: `${item.hit.top}%`,
              width: `${item.hit.width}%`,
              height: `${item.hit.height}%`,
            }}
            onPointerEnter={() => setFocused(item.id)}
            onPointerLeave={() => release(item.id)}
            onFocus={() => setFocused(item.id)}
            onBlur={() => release(item.id)}
          >
            <span className="sr-only">
              {`Inspect stage ${item.ordinal}, ${item.label}`}
            </span>
          </button>
        ))}

        {focusedStage && (
          <div
            id={panelId}
            // Below the drawing rather than inside it: the band is five
            // times wider than it is tall and every part of it is already
            // spoken for. Clamped so a stage at either end of the rail does
            // not push the panel off the side.
            className="pointer-events-none absolute w-[min(27rem,92%)] -translate-x-1/2 rounded-md border border-line-strong bg-surface p-4"
            style={{
              left: `${Math.min(Math.max(focusedLabel?.x ?? 50, 20), 80)}%`,
              top: "calc(100% + 0.75rem)",
            }}
          >
            <p className="eyebrow text-accent">
              {focusedLabel?.ordinal}
              {" · "}
              {focusedStage.label}
            </p>
            <p className="mt-2 text-small text-muted-foreground">
              {focusedStage.role}
            </p>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-foreground">
              {focusedStage.technologies.join("  ·  ")}
            </p>
            {focusedStage.projects.length > 0 && (
              <p className="mt-2 text-[11px] text-faint">
                {"Built in "}
                {focusedStage.projects
                  .map((id) => projectNames[id])
                  .join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
