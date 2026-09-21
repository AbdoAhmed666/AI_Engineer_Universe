import { SectionContainer, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { projectNames, type ProjectId } from "@/lib/projects";

const projects: {
  id: ProjectId;
  tag: string;
  description: string;
  capabilities: string[];
  tech: string[];
  github: string;
}[] = [
  {
    id: "ai-interview-agent",
    tag: "Full-Stack AI Application",
    description:
      "Production-grade AI technical interview platform using LLMs and RAG. Generates role-specific adaptive questions, evaluates answers with structured LLM scoring, and produces personalized feedback with hiring recommendations.",
    capabilities: [
      "Role-specific adaptive interview questions via LLMs",
      "LLM evaluation pipeline: scoring, feedback, knowledge-gap detection",
      "RAG pipeline with FAISS for context-aware personalization",
      "JWT authentication, session management, interview history",
      "Analytics dashboard and PDF report generation",
      "FastAPI backend + Next.js frontend, PostgreSQL persistence",
    ],
    tech: ["FastAPI", "Next.js", "PostgreSQL", "LangChain", "FAISS", "OpenAI", "Docker", "TypeScript"],
    github: "https://github.com/AbdoAhmed666/AI-Interview-Agent",
  },
  {
    id: "ai-internal-knowledge-assistant",
    tag: "RAG · LLM Infrastructure",
    description:
      "Internal knowledge assistant using RAG, embeddings, and FAISS retrieval to generate context-aware responses from a domain knowledge base. Optimized for CPU inference through INT8 quantization — reducing model size by 58.9% (293MB → 120MB).",
    capabilities: [
      "Modular RAG architecture: retrieval, generation, application layers",
      "FAISS vector retrieval with embedding-based semantic search",
      "FastAPI REST and streaming endpoints",
      "INT8 quantization: 58.9% model size reduction",
      "Docker-based deployment with documented latency trade-offs",
      "Tool-calling architecture with modular LLM orchestration",
    ],
    tech: ["Python", "FastAPI", "FAISS", "LangChain", "Docker", "Quantization", "REST API"],
    github: "https://github.com/AbdoAhmed666/electro-pi-ai-internal-knowledge-assistant",
  },
  {
    id: "gesture-smart-home",
    tag: "Graduation Project · Deep Learning · IoT",
    description:
      "Real-time gesture recognition system using a Bidirectional LSTM and wearable IMU sensors for accessibility-focused smart-home control. Achieved 98% recognition accuracy with 35% latency reduction.",
    capabilities: [
      "98% gesture recognition accuracy with BiLSTM + IMU sensors",
      "35% inference latency reduction through model optimization",
      "Real-time smart-home control for accessibility use cases",
      "End-to-end deployment on Railway and Azure",
      "Led 5-member development team through full project lifecycle",
      "TensorFlow/Keras training pipeline with IoT integration",
    ],
    tech: ["BiLSTM", "TensorFlow", "Keras", "IoT", "Azure", "Railway", "Python"],
    github: "https://github.com/AbdoAhmed666",
  },
];

export default function Projects() {
  return (
    <SectionContainer id="projects">
      <SectionHeading section="projects" title="Featured Projects" />

      <div className="flex flex-col gap-6">
        {projects.map((project) => (
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
