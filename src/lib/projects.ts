/**
 * Project identifiers.
 *
 * A stable, typed handle for each piece of work on the site, so that other
 * modules — `@/lib/pipeline` today, the 3D scene later — can reference a
 * project without repeating its display name. `Projects.tsx` owns the full
 * content of each entry; this module owns only the id and the name, which
 * is the part other modules need.
 *
 * Deliberately not a registry: adding a project means adding one union
 * member, one name and the entry in `Projects.tsx`.
 *
 * @example
 * import { projectNames, type ProjectId } from "@/lib/projects";
 *
 * const label = projectNames["ai-interview-agent"];
 */

/** Stable id for a project featured on the site. */
export type ProjectId =
  | "ai-interview-agent"
  | "ai-internal-knowledge-assistant"
  | "gesture-smart-home";

/** Display name for each {@link ProjectId}, as shown in the Projects section. */
export const projectNames: Record<ProjectId, string> = {
  "ai-interview-agent": "AI Interview Agent",
  "ai-internal-knowledge-assistant": "AI Internal Knowledge Assistant",
  "gesture-smart-home": "Real-Time Gesture Smart Home",
};
