import Image from "next/image";
import { Brain, Database, Bot, Layers } from "lucide-react";
import { SectionContainer, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";

const highlights = [
  { icon: Brain, title: "LLMs", desc: "GPT-4, Claude, Gemini, open-source models" },
  { icon: Database, title: "RAG Systems", desc: "Vector search, chunking, reranking" },
  { icon: Bot, title: "Agents", desc: "Tool use, planning, multi-step reasoning" },
  { icon: Layers, title: "Full-Stack", desc: "FastAPI, Next.js, PostgreSQL, Docker" },
];

export default function About() {
  return (
    <SectionContainer id="about">
      <SectionHeading
        section="about"
        title="Building AI Systems That Work in the Real World"
      />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
        <Reveal>
          <div className="relative mb-8 h-24 w-24 overflow-hidden rounded-xl border border-line">
            <Image
              src="/me.jpg"
              alt="Abdelrhman Ahmed"
              fill
              sizes="96px"
              className="object-cover object-top"
            />
          </div>
          <p className="mb-4 text-body text-muted-foreground">
            I’m an AI Engineer specializing in end-to-end AI applications — from LLM pipelines
            and RAG systems to deep learning models and scalable backends. My work spans
            the full stack: Python, FastAPI, FAISS, LangChain, PostgreSQL, and Next.js.
          </p>
          <p className="mb-4 text-body text-muted-foreground">
            I’ve built adaptive interview agents, internal knowledge assistants, and
            gesture-recognition systems deployed in production. I care about systems that
            actually work: grounded retrieval, measurable evaluation, and deployment-ready
            architecture — not just demos.
          </p>
          <p className="mt-6 border-t border-line pt-4 text-small text-faint">
            B.S. Computing and Data Science — Alexandria, 2025 · HCIA-AI Certified (Huawei/NTI)
          </p>
        </Reveal>

        <Reveal delay={0.1} className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-strong"
            >
              <item.icon size={18} className="mb-4 text-accent" aria-hidden="true" />
              <h3 className="mb-1 text-small font-medium text-foreground">{item.title}</h3>
              <p className="text-small text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </SectionContainer>
  );
}
