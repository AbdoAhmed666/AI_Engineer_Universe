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
  /** Lit windows. */
  window: string;
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
    window: token("--accent", "#8fafc4"),
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
  target: new THREE.Vector3(0, 1.6, 0),
} as const;

// ─── Ground ──────────────────────────────────────────────────────────────────

/** Kerbs and lane markings, built from the layout's own street. */
function Road({
  kerbs,
  centreLine,
  kerbColor,
  laneColor,
}: {
  kerbs: readonly Kerb[];
  centreLine: readonly Kerb[];
  kerbColor: string;
  laneColor: string;
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
  const laneGeometry = useMemo(() => build(centreLine), [centreLine]);

  return (
    <group>
      <lineSegments geometry={kerbGeometry} raycast={() => null}>
        <lineBasicMaterial color={kerbColor} transparent opacity={0.75} fog />
      </lineSegments>
      <lineSegments geometry={laneGeometry} raycast={() => null}>
        <lineBasicMaterial color={laneColor} transparent opacity={0.4} fog />
      </lineSegments>
    </group>
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

/** Every lit window in the city, as one instanced mesh. */
function Windows({
  layout,
  color,
}: {
  layout: CityLayout;
  color: string;
}): React.ReactElement {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const bays = useMemo(
    () =>
      layout.buildings.flatMap((building) =>
        building.floors.flatMap((floor) => floor.bays)
      ),
    [layout]
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    const quaternion = new THREE.Quaternion();
    for (let index = 0; index < bays.length; index += 1) {
      const bay = bays[index];
      position.set(bay.position[0], bay.position[1], bay.position[2]);
      // Facades face outward; a quad's default normal is +Z.
      quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), bay.rotationY);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [bays]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, Math.max(bays.length, 1)]}
      raycast={() => null}
    >
      <planeGeometry args={[0.17, 0.3]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} fog />
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

/** Every building in the city, as four draw calls. */
function Buildings({
  layout,
  palette,
  onPick,
}: {
  layout: CityLayout;
  palette: Palette;
  /** Called with the box under the pointer, or null when it leaves. */
  onPick: (box: Box | null) => void;
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
  layout,
  labelRefs,
  onReady,
}: {
  orbit: React.RefObject<OrbitState>;
  layout: CityLayout;
  labelRefs: React.RefObject<(HTMLElement | null)[]>;
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

  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      invalidate();
      onReady?.();
    }
  }, [size.width, size.height, invalidate, onReady]);

  useFrame(() => {
    /*
     * Both the camera and the label elements are mutated directly here, and
     * deliberately: they are `three` and DOM objects, and routing a pointer
     * drag through React state would re-render the tree every frame. The
     * compiler's immutability rule cannot see that, so it is waived for the
     * body of the loop.
     */
    /* eslint-disable react-hooks/immutability */
    const state = orbit.current;
    const sinPolar = Math.sin(state.polar);
    camera.position.set(
      ORBIT.target.x + state.radius * sinPolar * Math.sin(state.azimuth),
      ORBIT.target.y + state.radius * Math.cos(state.polar),
      ORBIT.target.z + state.radius * sinPolar * Math.cos(state.azimuth)
    );
    camera.lookAt(ORBIT.target);
    // `lookAt` leaves `matrixWorldInverse` stale, and that is the matrix
    // `project()` reads. Without this the labels are pinned to where the
    // camera was on the previous frame, which in demand mode is wherever it
    // last stopped.
    camera.updateMatrixWorld();

    const nodes = labelRefs.current;
    if (!nodes) return;
    for (let index = 0; index < anchors.length; index += 1) {
      const node = nodes[index];
      if (!node) continue;
      const projected = anchors[index].clone().project(camera);
      const x = ((projected.x + 1) / 2) * size.width;
      const y = ((1 - projected.y) / 2) * size.height;
      const behind = projected.z > 1;
      node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
      node.style.opacity = behind ? "0" : "1";
    }
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
  const panelId = useId();

  const building = useMemo(
    () => layout.buildings.find((item) => item.id === inspected) ?? null,
    [layout, inspected]
  );

  const onPick = useCallback((box: Box | null) => {
    setPicked(box);
    if (box) setInspected(box.building);
  }, []);
  const orbit = useRef<OrbitState>({ azimuth: 0.44, polar: 1.50, radius: 16.5 });
  const labelRefs = useRef<(HTMLElement | null)[]>([]);
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);

  const nudge = useCallback(() => invalidateRef.current?.(), []);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    dragging.current = { x: event.clientX, y: event.clientY };
    (event.target as Element).setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const start = dragging.current;
      if (!start) return;
      const state = orbit.current;
      state.azimuth -= (event.clientX - start.x) * 0.006;
      state.polar = Math.min(
        ORBIT.maxPolar,
        Math.max(ORBIT.minPolar, state.polar - (event.clientY - start.y) * 0.004)
      );
      dragging.current = { x: event.clientX, y: event.clientY };
      nudge();
    },
    [nudge]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const onWheel = useCallback(
    (event: React.WheelEvent) => {
      const state = orbit.current;
      state.radius = Math.min(
        ORBIT.maxRadius,
        Math.max(ORBIT.minRadius, state.radius + event.deltaY * 0.02)
      );
      nudge();
    },
    [nudge]
  );

  // Arrow keys orbit too, so the world is reachable without a pointer.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const state = orbit.current;
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
  }, [nudge]);

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
          layout={layout}
          labelRefs={labelRefs}
          onReady={onReady}
        />
        <Ground color={palette.line} />
        <Road
          kerbs={layout.kerbs}
          centreLine={layout.centreLine}
          kerbColor={palette.kerb}
          laneColor={palette.faint}
        />
        <Buildings layout={layout} palette={palette} onPick={onPick} />
        <FloorHighlight
          box={picked?.building === inspected ? picked : null}
          color={palette.accent}
        />
        <Windows layout={layout} color={palette.window} />
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
            style={{ opacity: 0 }}
            onPointerDown={(event) => event.stopPropagation()}
            onFocus={() => setInspected(item.id)}
            onBlur={() =>
              setInspected((current) => (current === item.id ? null : current))
            }
          >
            {item.name}
          </button>
        ))}
      </div>

      {building && (
        <div
          id={panelId}
          className="pointer-events-none absolute bottom-20 left-6 w-[min(24rem,calc(100%-3rem))] rounded-md border border-line-strong bg-surface p-5 sm:left-8"
        >
          <p className="eyebrow text-accent">{building.name}</p>
          {building.plinth && (
            <p className="mt-1 text-[11px] text-faint">
              {`Deployed on ${building.plinth.labels.join(", ")}`}
            </p>
          )}

          {/*
            Floors top down, the way the building is read rather than the
            way it is stacked. Each one names its parts and the pipeline
            stages it implements — the same stages the Hero's rail draws,
            which is the whole point: the building is where they landed.
          */}
          <ul className="mt-4 flex flex-col-reverse gap-3">
            {building.floors.map((floor) => (
              <li
                key={floor.id}
                className={cn(
                  "border-l pl-3",
                  picked?.floor?.id === floor.id && picked.building === building.id
                    ? "border-accent"
                    : "border-line"
                )}
              >
                <p
                  className={cn(
                    "font-mono text-[11px]",
                    floor.kind === "ai" ? "text-accent" : "text-foreground"
                  )}
                >
                  {floor.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {floor.modules.join(" · ")}
                </p>
                {floor.stages.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-faint">
                    {`Implements ${floor.stages.map(stageLabel).join(", ")}`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
