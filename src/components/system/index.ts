/**
 * Barrel exports for the system visualization module.
 *
 * Representations of the pipeline defined in `@/lib/pipeline`. The 2D
 * schematic lives here today; a future 3D scene will sit alongside it and
 * read the same data.
 *
 * @example
 * import { SystemSchematic } from "@/components/system";
 */

export { SystemSchematic } from "./SystemSchematic";
export type { SystemSchematicProps } from "./SystemSchematic";

export { SystemVisualization } from "./SystemVisualization";
export type { SystemVisualizationProps } from "./SystemVisualization";

export { AskBox } from "./AskBox";
export type { AskBoxProps } from "./AskBox";

export { WorldOverlay } from "./WorldOverlay";
export type { WorldOverlayProps } from "./WorldOverlay";
