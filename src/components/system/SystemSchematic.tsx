/**
 * System schematic.
 *
 * An engineering drawing of the retrieval-augmented architecture defined in
 * `@/lib/pipeline`. Two inline SVG renderings of the *same* data — a
 * horizontal rail from `lg` up, a vertical rail below it — plus a
 * screen-reader list carrying the full text of every stage, so none of the
 * information exists only as a picture.
 *
 * Server component: no state, no effects, no client JavaScript, no canvas.
 * It is the 2D counterpart of the future `SignalPathScene`, which will read
 * the same `pipeline` export.
 *
 * @example
 * import { SystemSchematic } from "@/components/system";
 *
 * <SystemSchematic />
 */

import { cn } from "@/lib/utils";
import { bootDelay, bootSequence } from "@/lib/animations";
import {
  formatStageOrdinal,
  getPhaseGroups,
  pipeline,
  type PipelineStage,
} from "@/lib/pipeline";

/**
 * Props for the {@link SystemSchematic} component.
 */
export interface SystemSchematicProps {
  className?: string;
}

// ─── Shared drawing values ───────────────────────────────────────────────────

/** Hairline stroke shared by every rule, rail and node outline. */
const HAIRLINE = {
  strokeWidth: 1,
  vectorEffect: "non-scaling-stroke",
} as const;

/** Half the side length of a stage node square. */
const NODE = 3.5;

/**
 * Largest on-screen scale each rendering can reach, used to size TRACE dash
 * patterns. Both are bounded rather than estimated: the horizontal rail sits
 * in the 1200px page container, whose side padding never drops below 48px
 * (1104 / 1000 viewBox units); the vertical rail is capped at `max-w-[24rem]`
 * (384 / 300 viewBox units).
 */
const MAX_SCALE = { horizontal: 1.11, vertical: 1.28 } as const;

/** Options accepted by {@link motionStyle}. */
interface MotionStyleOptions {
  /** Overrides the gesture's default duration, in milliseconds. */
  duration?: number;
  /** Length of a TRACE stroke in user units, before scaling. */
  traceLength?: number;
  /** Which rendering the stroke belongs to. */
  orientation?: keyof typeof MAX_SCALE;
}

/**
 * Inline custom properties that schedule one element of the BOOT sequence.
 *
 * The gesture itself lives in CSS (`.motion-trace`, `.motion-mark`,
 * `.motion-settle`) and only exists under `prefers-reduced-motion:
 * no-preference`; these properties supply its position in the sequence.
 * Written during the server render, so BOOT costs no client JavaScript.
 *
 * @param delayMs - Delay from first paint, from `bootDelay`.
 * @param options - Duration override and TRACE stroke length.
 */
function motionStyle(
  delayMs: number,
  options: MotionStyleOptions = {}
): React.CSSProperties {
  const { duration, traceLength, orientation = "horizontal" } = options;
  const style: Record<string, string> = { "--motion-delay": `${delayMs}ms` };
  if (duration !== undefined) {
    style["--motion-duration"] = `${duration}ms`;
  }
  if (traceLength !== undefined) {
    style["--motion-length"] = `${Math.ceil(traceLength * MAX_SCALE[orientation])}px`;
  }
  return style as React.CSSProperties;
}

const phaseGroups = getPhaseGroups(pipeline);
const stages = pipeline.stages;

/** Phase label for a given stage, used by the accessible description. */
function phaseLabelOf(stage: PipelineStage): string {
  return (
    pipeline.phases.find((phase) => phase.id === stage.phase)?.label ??
    stage.phase
  );
}

// ─── Horizontal rendering (lg and up) ────────────────────────────────────────

const H = {
  width: 1000,
  height: 196,
  firstX: 60,
  lastX: 940,
  phaseLabelY: 22,
  phaseRuleY: 32,
  ordinalY: 58,
  labelY: 78,
  railY: 98,
  techFirstY: 126,
  techStep: 14,
} as const;

/** Centre x of the stage at `index` on the horizontal rail. */
function horizontalX(index: number): number {
  const pitch = (H.lastX - H.firstX) / (stages.length - 1);
  return H.firstX + pitch * index;
}

/**
 * Horizontal rail: phases across the top, stage labels above the rail,
 * technologies stacked below each node.
 */
function HorizontalSchematic(): React.ReactElement {
  const dividerIndex = phaseGroups[1]?.startIndex ?? phaseGroups[0].endIndex;
  const dividerX =
    (horizontalX(phaseGroups[0].endIndex) + horizontalX(dividerIndex)) / 2;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${H.width} ${H.height}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className="hidden font-mono lg:block"
    >
      {/* Boundary between the build-time and per-request halves. */}
      <line
        className="motion-settle"
        style={motionStyle(bootDelay(dividerIndex))}
        x1={dividerX}
        y1={14}
        x2={dividerX}
        y2={H.height - 8}
        stroke="var(--line)"
        strokeDasharray="2 6"
        {...HAIRLINE}
      />

      {/* Phase rules and labels. */}
      {phaseGroups.map((group) => {
        const from = horizontalX(group.startIndex) - 30;
        const to = horizontalX(group.endIndex) + 30;
        return (
          <g key={group.phase.id}>
            <line
              className="motion-trace"
              style={motionStyle(bootDelay(group.startIndex), {
                traceLength: to - from,
              })}
              x1={from}
              y1={H.phaseRuleY}
              x2={to}
              y2={H.phaseRuleY}
              stroke="var(--line-strong)"
              {...HAIRLINE}
            />
            <text
              className="motion-settle"
              style={motionStyle(bootDelay(group.startIndex, "label"))}
              x={(from + to) / 2}
              y={H.phaseLabelY}
              textAnchor="middle"
              fontSize={11}
              letterSpacing={0.9}
              fill="var(--accent)"
            >
              {`${group.phase.label} · ${group.phase.cadence}`.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* The rail itself, with a direction marker at the end. */}
      <line
        className="motion-trace"
        style={motionStyle(bootSequence.start, {
          duration: bootSequence.rail,
          traceLength: 966 - 24,
        })}
        x1={24}
        y1={H.railY}
        x2={966}
        y2={H.railY}
        stroke="var(--line-strong)"
        {...HAIRLINE}
      />
      <polyline
        className="motion-settle"
        style={motionStyle(bootDelay(stages.length - 1, "label"))}
        points={`961,${H.railY - 4} 967,${H.railY} 961,${H.railY + 4}`}
        fill="none"
        stroke="var(--accent)"
        {...HAIRLINE}
      />

      {/* Stages. */}
      {stages.map((stage, index) => {
        const x = horizontalX(index);
        return (
          <g key={stage.id}>
            {/* Ordinal and label settle together, just after the node. */}
            <g
              className="motion-settle"
              style={motionStyle(bootDelay(index, "label"))}
            >
              <text
                x={x}
                y={H.ordinalY}
                textAnchor="middle"
                fontSize={10}
                letterSpacing={0.6}
                fill="var(--faint)"
              >
                {formatStageOrdinal(index)}
              </text>
              <text
                x={x}
                y={H.labelY}
                textAnchor="middle"
                fontSize={13}
                fill="var(--foreground)"
              >
                {stage.label}
              </text>
            </g>

            {/* The node appears as the rail's leading edge reaches it. */}
            <rect
              className="motion-mark"
              style={motionStyle(bootDelay(index))}
              x={x - NODE}
              y={H.railY - NODE}
              width={NODE * 2}
              height={NODE * 2}
              fill="var(--background)"
              stroke="var(--line-strong)"
              {...HAIRLINE}
            />

            {/* Tick and technology metadata settle last. */}
            <g
              className="motion-settle"
              style={motionStyle(bootDelay(index, "meta"))}
            >
              <line
                x1={x}
                y1={H.railY + 8}
                x2={x}
                y2={H.techFirstY - 10}
                stroke="var(--line)"
                {...HAIRLINE}
              />
              {stage.technologies.map((technology, row) => (
                <text
                  key={technology}
                  x={x}
                  y={H.techFirstY + row * H.techStep}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--faint)"
                >
                  {technology}
                </text>
              ))}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Vertical rendering (below lg) ───────────────────────────────────────────

const V = {
  width: 300,
  railX: 26,
  ordinalX: 46,
  textX: 68,
  ruleFromX: 20,
  ruleToX: 282,
  techStep: 13,
  stageGap: 20,
  /** Characters that fit on one technology line at the chosen mono size. */
  techLineChars: 34,
} as const;

/**
 * Greedily packs a stage's technologies into `·`-separated lines that fit
 * the vertical rail's text column, so the rail stays compact instead of
 * running one token per row.
 */
function packTechnologies(technologies: readonly string[]): string[] {
  const lines: string[] = [];
  let current = "";

  for (const technology of technologies) {
    const candidate = current ? `${current} · ${technology}` : technology;
    if (current && candidate.length > V.techLineChars) {
      lines.push(current);
      current = technology;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines;
}

/** One laid-out row of the vertical rail. */
interface VerticalRow {
  stage: PipelineStage;
  index: number;
  nodeY: number;
  labelY: number;
  techFirstY: number;
  techLines: string[];
}

/** One laid-out phase header of the vertical rail. */
interface VerticalHeader {
  id: string;
  text: string;
  labelY: number;
  ruleY: number;
  /** Index of the phase's first stage, used to schedule its BOOT delay. */
  startIndex: number;
}

/**
 * Walks the phases and stages once to produce absolute y positions and the
 * total height, so the viewBox always fits the content exactly.
 */
function layoutVertical(): {
  headers: VerticalHeader[];
  rows: VerticalRow[];
  height: number;
} {
  const headers: VerticalHeader[] = [];
  const rows: VerticalRow[] = [];
  let y = 6;
  let index = 0;

  for (const group of phaseGroups) {
    y += 12;
    headers.push({
      id: group.phase.id,
      text: `${group.phase.label} · ${group.phase.cadence}`.toUpperCase(),
      labelY: y,
      ruleY: y + 8,
      startIndex: index,
    });
    y += 24;

    for (const stage of group.stages) {
      const techFirstY = y + 24;
      const techLines = packTechnologies(stage.technologies);
      rows.push({
        stage,
        index,
        nodeY: y + 4,
        labelY: y + 8,
        techFirstY,
        techLines,
      });
      index += 1;
      y =
        techFirstY +
        Math.max(techLines.length - 1, 0) * V.techStep +
        V.stageGap;
    }

    y += 6;
  }

  return { headers, rows, height: y + 4 };
}

/**
 * Vertical rail: the same stages stacked, so the schematic stays legible on
 * narrow screens instead of shrinking to an unreadable strip.
 */
function VerticalSchematic({
  className,
}: {
  className?: string;
}): React.ReactElement {
  const { headers, rows, height } = layoutVertical();
  const firstNodeY = rows[0].nodeY;
  const lastNodeY = rows[rows.length - 1].nodeY;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${V.width} ${height}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className={cn("font-mono", className)}
    >
      {/* The rail, with a direction marker at the end. */}
      <line
        className="motion-trace"
        style={motionStyle(bootSequence.start, {
          duration: bootSequence.rail,
          traceLength: lastNodeY + 24 - firstNodeY,
          orientation: "vertical",
        })}
        x1={V.railX}
        y1={firstNodeY}
        x2={V.railX}
        y2={lastNodeY + 24}
        stroke="var(--line-strong)"
        {...HAIRLINE}
      />
      <polyline
        className="motion-settle"
        style={motionStyle(bootDelay(rows.length - 1, "label"))}
        points={`${V.railX - 4},${lastNodeY + 22} ${V.railX},${lastNodeY + 28} ${V.railX + 4},${lastNodeY + 22}`}
        fill="none"
        stroke="var(--accent)"
        {...HAIRLINE}
      />

      {/* Phase headers. */}
      {headers.map((header) => (
        <g key={header.id}>
          <text
            className="motion-settle"
            style={motionStyle(bootDelay(header.startIndex, "label"))}
            x={V.ordinalX}
            y={header.labelY}
            fontSize={10}
            letterSpacing={0.8}
            fill="var(--accent)"
          >
            {header.text}
          </text>
          <line
            className="motion-trace"
            style={motionStyle(bootDelay(header.startIndex), {
              traceLength: V.ruleToX - V.ruleFromX,
              orientation: "vertical",
            })}
            x1={V.ruleFromX}
            y1={header.ruleY}
            x2={V.ruleToX}
            y2={header.ruleY}
            stroke="var(--line-strong)"
            {...HAIRLINE}
          />
        </g>
      ))}

      {/* Stages. */}
      {rows.map((row) => (
        <g key={row.stage.id}>
          {/* The node appears as the rail's leading edge reaches it. */}
          <rect
            className="motion-mark"
            style={motionStyle(bootDelay(row.index))}
            x={V.railX - NODE}
            y={row.nodeY - NODE}
            width={NODE * 2}
            height={NODE * 2}
            fill="var(--background)"
            stroke="var(--line-strong)"
            {...HAIRLINE}
          />

          {/* Tick, ordinal and label settle together, just after the node. */}
          <g
            className="motion-settle"
            style={motionStyle(bootDelay(row.index, "label"))}
          >
            <line
              x1={V.railX + 8}
              y1={row.nodeY}
              x2={V.ordinalX - 6}
              y2={row.nodeY}
              stroke="var(--line)"
              {...HAIRLINE}
            />
            <text
              x={V.ordinalX}
              y={row.labelY}
              fontSize={10}
              letterSpacing={0.6}
              fill="var(--faint)"
            >
              {formatStageOrdinal(row.index)}
            </text>
            <text
              x={V.textX}
              y={row.labelY}
              fontSize={12.5}
              fill="var(--foreground)"
            >
              {row.stage.label}
            </text>
          </g>

          {/* Technology metadata settles last. */}
          <g
            className="motion-settle"
            style={motionStyle(bootDelay(row.index, "meta"))}
          >
            {row.techLines.map((line, techRow) => (
              <text
                key={line}
                x={V.textX}
                y={row.techFirstY + techRow * V.techStep}
                fontSize={10}
                fill="var(--faint)"
              >
                {line}
              </text>
            ))}
          </g>
        </g>
      ))}
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Renders the pipeline as an engineering schematic.
 *
 * @param props - Optional class name overrides.
 * @returns The rendered figure.
 */
export function SystemSchematic({
  className,
}: SystemSchematicProps): React.ReactElement {
  return (
    <figure className={cn("m-0", className)}>
      <figcaption className="grid gap-x-12 gap-y-2 md:grid-cols-[3fr_7fr]">
        <p className="eyebrow pt-1">{pipeline.title}</p>
        <p className="max-w-[58ch] text-small text-muted-foreground">
          {pipeline.summary}
        </p>
      </figcaption>

      {/*
        Below `lg` the rail runs vertically, capped in width so it scales up
        to a readable size on a phone without ballooning on a tablet; it
        sits in the wide column of the editorial grid from `md`.
      */}
      <div
        data-boot-anchor=""
        className="mt-10 grid gap-x-12 sm:mt-14 md:grid-cols-[3fr_7fr] lg:block"
      >
        <HorizontalSchematic />
        <VerticalSchematic className="max-w-[24rem] md:col-start-2 lg:hidden" />
      </div>

      <ol className="sr-only">
        {stages.map((stage, index) => (
          <li key={stage.id}>
            {`Stage ${index + 1} of ${stages.length}, ${phaseLabelOf(stage)} phase — ${stage.label}. ${stage.role} Built with ${stage.technologies.join(", ")}.`}
          </li>
        ))}
      </ol>
    </figure>
  );
}

export default SystemSchematic;
