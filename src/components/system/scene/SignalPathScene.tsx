/**
 * Signal Path scene.
 *
 * The 3D rendering of the pipeline, reading the same data as the 2D
 * schematic through `./layout`. Static by design: this phase builds the
 * drawing, the camera and the labels. The travelling signal (FLOW) and
 * stage inspection (FOCUS) come later.
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
 *
 * Loaded only via `next/dynamic` with `ssr: false`, so `three` and
 * `@react-three/fiber` stay out of the initial bundle. No `drei`: the scene
 * needs lines, boxes and a projection, and avoiding it keeps
 * `troika-three-text` and `three-stdlib` out of the chunk.
 *
 * Budget: no lights, no shadows, no textures, no postprocessing, flat
 * `MeshBasicMaterial` only, `frameloop="demand"`.
 */

"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getSceneLayout, type SceneLayout, type Vec3 } from "./layout";

/**
 * Props for the {@link SignalPathScene} component.
 */
export interface SignalPathSceneProps {
  /** Called once the renderer exists and the first frame has been drawn. */
  onReady?: () => void;
}

/** A stage label placed in the DOM, in percentages of the canvas box. */
interface ProjectedLabel {
  id: string;
  label: string;
  ordinal: string;
  x: number;
  y: number;
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

/** How far above a slab its label is anchored, in world units. */
const LABEL_LIFT = 0.46;

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
  onProject: (labels: ProjectedLabel[]) => void;
  onReady?: () => void;
}): null {
  const { camera, size, invalidate } = useThree();

  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;

    // Fit the drawing's width, with room for the labels above each slab.
    //
    // The camera is a `three` object, and framing it means mutating it —
    // that is how react-three-fiber is meant to be driven. The compiler's
    // immutability rule cannot see that, so it is waived here and only here.
    /* eslint-disable react-hooks/immutability */
    const margin = 1.6;
    const target = new THREE.Vector3(0, -0.15, -1.4);
    const orthographic = camera as THREE.OrthographicCamera;
    orthographic.zoom = size.width / ((layout.extent.x + margin) * 2);
    camera.position.set(1, 12, 10);
    camera.lookAt(target);
    orthographic.updateProjectionMatrix();
    camera.updateMatrixWorld();
    /* eslint-enable react-hooks/immutability */

    const projected = layout.nodes.map((node) => {
      // Anchor the label clear of the slab: the slab has depth, so its drawn
      // top edge sits well above its centre in screen space, and a label
      // pinned to the centre lands on top of the drawing.
      const vector = new THREE.Vector3(...node.position);
      vector.y += LABEL_LIFT;
      vector.project(camera);
      return {
        id: node.id,
        label: node.label,
        ordinal: String(node.index + 1).padStart(2, "0"),
        x: ((vector.x + 1) / 2) * 100,
        y: ((1 - vector.y) / 2) * 100,
      };
    });

    onProject(projected);
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
}: SignalPathSceneProps): React.ReactElement {
  const layout = useMemo(() => getSceneLayout(), []);
  const palette = useMemo(() => readPalette(), []);
  const [labels, setLabels] = useState<ProjectedLabel[]>([]);

  return (
    <div className="relative h-full w-full">
      <Canvas
        orthographic
        camera={{ position: [1, 12, 10], zoom: 69 }}
        dpr={[1, 1.75]}
        frameloop="demand"
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        style={{ width: "100%", height: "100%" }}
      >
        <Framing layout={layout} onProject={setLabels} onReady={onReady} />
        <Rail points={layout.rail} color={palette.foreground} />
        <Stages positions={layout.rail} palette={palette} />
        <Corpus
          field={layout.field}
          retrieved={layout.retrieved}
          palette={palette}
        />
        <Segments points={layout.reach} color={palette.accent} opacity={0.4} />
      </Canvas>

      {/*
        Labels are DOM, not geometry: crisp at any pixel ratio, coloured by
        the same tokens as the rest of the page, and free of the canvas
        budget. They duplicate the schematic's screen-reader list, so they
        are hidden from assistive technology.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {labels.map((item) => (
          <span
            key={item.id}
            className="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap text-center font-mono leading-tight"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            <span className="block text-[10px] text-faint">{item.ordinal}</span>
            <span className="block text-[13px] text-foreground">
              {item.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
