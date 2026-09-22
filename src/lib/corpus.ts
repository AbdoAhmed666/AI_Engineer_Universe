/**
 * The corpus the ask box answers from.
 *
 * Built from the same three modules the page is drawn from — nothing is
 * written for the assistant to say. If a question cannot be answered from
 * what the site already claims, the honest answer is that it cannot be
 * answered, and the retrieval returning nothing is how that happens.
 *
 * Every document carries a `cite`: the place on this site the claim comes
 * from. That is the same rule the city is drawn by, applied to text — a
 * grounded answer and a derived building are the same idea.
 *
 * Small on purpose. Three projects, nine stages and a dozen layers come to
 * a few dozen short documents, which is why this needs no vector database:
 * the whole corpus and its embeddings fit in a file.
 *
 * @example
 * import { getCorpus } from "@/lib/corpus";
 *
 * for (const doc of getCorpus()) console.log(doc.cite.label, doc.text);
 */

import { architectures, deployments } from "./architecture";
import { pipeline } from "./pipeline";
import { projectDetails, projectNames } from "./projects";

/** Where a claim comes from, as a reader could check it. */
export interface Citation {
  /** Human-readable, e.g. `"AI Interview Agent"`. */
  readonly label: string;
  /** Which part of the site holds it. */
  readonly kind: "project" | "capability" | "stage" | "layer" | "deployment";
  /** Anchor on the page, for a link back to the claim. */
  readonly href: string;
}

/** One retrievable unit of what this site claims. */
export interface CorpusDocument {
  readonly id: string;
  /** Text the retriever matches against and the model is given. */
  readonly text: string;
  readonly cite: Citation;
}

/**
 * Builds the corpus.
 *
 * Each document repeats the name of the thing it is about, because a chunk
 * is retrieved on its own and "it uses FAISS" is useless without knowing
 * what "it" is.
 *
 * @returns Every document, in a stable order.
 */
export function getCorpus(): readonly CorpusDocument[] {
  const docs: CorpusDocument[] = [];

  for (const project of projectDetails) {
    const name = projectNames[project.id];

    docs.push({
      id: `project:${project.id}`,
      text: `${name} — ${project.tag}. ${project.description} Built with ${project.tech.join(", ")}. Source: ${project.github}`,
      cite: { label: name, kind: "project", href: "#projects" },
    });

    project.capabilities.forEach((capability, index) => {
      docs.push({
        id: `capability:${project.id}:${index}`,
        text: `${name}: ${capability}`,
        cite: { label: name, kind: "capability", href: "#projects" },
      });
    });

    const targets = deployments[project.id];
    if (targets?.length) {
      docs.push({
        id: `deployment:${project.id}`,
        text: `${name} is deployed on ${targets.join(", ")}.`,
        cite: { label: name, kind: "deployment", href: "#projects" },
      });
    }

    for (const layer of architectures[project.id].layers) {
      const parts = layer.modules.map((module) => module.label).join(", ");
      const stages = layer.stages.length
        ? ` It implements the ${layer.stages.join(", ")} stage${layer.stages.length > 1 ? "s" : ""} of the pipeline.`
        : "";
      docs.push({
        id: `layer:${project.id}:${layer.id}`,
        text: `${name} has a ${layer.label} layer made of: ${parts}.${stages}`,
        cite: { label: `${name} · ${layer.label}`, kind: "layer", href: "#projects" },
      });
    }
  }

  pipeline.stages.forEach((stage, index) => {
    const behind = stage.projects.map((id) => projectNames[id]).join(" and ");
    docs.push({
      id: `stage:${stage.id}`,
      text: `${stage.label} is stage ${index + 1} of ${pipeline.stages.length} in the ${pipeline.title.toLowerCase()}, in the ${stage.phase} phase. ${stage.role} It uses ${stage.technologies.join(", ")}. It is substantiated by ${behind}.`,
      cite: { label: `Pipeline · ${stage.label}`, kind: "stage", href: "#home" },
    });
  });

  return docs;
}
