import { SectionContainer, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { projectDetails, projectNames } from "@/lib/projects";



export default function Projects() {
  return (
    <SectionContainer id="projects">
      <SectionHeading section="projects" title="Featured Projects" />

      <div className="flex flex-col gap-6">
        {projectDetails.map((project) => (
          <Reveal key={project.id}>
            <article className="rounded-xl border border-line bg-surface p-6 sm:p-10">
              <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
                <div>
                  <p className="eyebrow mb-3">{project.tag}</p>
                  <h3 className="text-h3 text-foreground">{projectNames[project.id]}</h3>
                  <p className="mt-4 max-w-[62ch] text-body text-muted-foreground">
                    {project.description}
                  </p>
                  <ul className="mt-6 space-y-2">
                    {project.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-3 text-small text-foreground/85">
                        <span className="font-mono text-accent" aria-hidden="true">
                          —
                        </span>
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="border-t border-line pt-3">
                    <p className="eyebrow mb-3">Tech Stack</p>
                    <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-small text-foreground">
                      {project.tech.map((tech) => (
                        <span key={tech} className="whitespace-nowrap">
                          {tech}
                        </span>
                      ))}
                    </p>
                  </div>
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start text-small text-accent underline-offset-4 hover:underline"
                  >
                    View on GitHub <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </SectionContainer>
  );
}
