import { SectionContainer, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";

const skillGroups = [
  {
    category: "AI / Machine Learning",
    skills: ["Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Keras", "Scikit-learn", "Computer Vision", "NLP", "BiLSTM"],
  },
  {
    category: "LLM / Generative AI",
    skills: ["LLMs", "Generative AI", "RAG", "Embeddings", "FAISS", "LangChain", "Prompt Engineering", "Quantization"],
  },
  {
    category: "Backend / Systems",
    skills: ["Python", "FastAPI", "REST APIs", "SQLAlchemy", "Alembic", "Pydantic", "JWT Auth", "SQL"],
  },
  {
    category: "Frontend",
    skills: ["Next.js", "React", "TypeScript"],
  },
  {
    category: "Databases",
    skills: ["PostgreSQL", "SQLite", "FAISS"],
  },
  {
    category: "Deployment / Tools",
    skills: ["Docker", "Azure", "Railway", "Git", "GitHub", "Vercel"],
  },
];

export default function Skills() {
  return (
    <SectionContainer id="skills">
      <SectionHeading section="skills" title="Tools I Build With" />

      <Reveal>
        <dl>
          {skillGroups.map((group) => (
            <div
              key={group.category}
              className="grid gap-x-12 gap-y-2 border-t border-line py-6 last:border-b md:grid-cols-[3fr_7fr]"
            >
              <dt className="text-small font-medium text-foreground">{group.category}</dt>
              <dd className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-small text-muted-foreground">
                {group.skills.map((skill) => (
                  <span key={skill} className="whitespace-nowrap">
                    {skill}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </SectionContainer>
  );
}
