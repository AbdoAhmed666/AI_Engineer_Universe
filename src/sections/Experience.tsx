import { SectionContainer, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";

const experiences = [
  {
    role: "Data Scientist & AI Instructor",
    company: "Arabian Academy",
    period: "Jul 2025 – Sep 2025",
    bullets: [
      "Delivered advanced AI and Data Science training to 50+ college students",
      "Supervised 10+ projects across Computer Vision, NLP, and LLM applications — contributing to 5 published prototypes",
      "Developed project-based materials that increased class participation by 60% and retention by 25%",
    ],
    tech: ["Machine Learning", "Computer Vision", "NLP", "LLMs", "Python"],
  },
  {
    role: "AI Instructor",
    company: "I School Egypt",
    period: "Mar 2025 – Aug 2025",
    bullets: [
      "Delivered 20+ practical AI and Python workshops to 100+ students",
      "Used coding and project-based learning methodology",
    ],
    tech: ["Python", "AI", "Workshops"],
  },
  {
    role: "AI & Machine Learning Coach",
    company: "Elharefa & Digital Egypt Pioneers Initiative (EDPI)",
    period: "Oct 2024 – Jul 2025",
    bullets: [
      "Mentored 90+ students in Machine Learning and AI Engineering through project-based development",
      "Guided trainees through model development, evaluation, and deployment workflows",
      "Supported 80%+ of trainees in achieving freelance or remote work opportunities",
    ],
    tech: ["Machine Learning", "AI Engineering", "Model Deployment", "Python"],
  },
  {
    role: "AI & Data Science Instructor",
    company: "YAT Learning Centers",
    period: "Feb 2025",
    bullets: [
      "Delivered introductory AI and Data Science training with Python",
      "Connected Machine Learning concepts to practical applications",
    ],
    tech: ["Python", "Machine Learning", "Data Science"],
  },
];

export default function Experience() {
  return (
    <SectionContainer id="experience">
      <SectionHeading section="experience" title="Experience" />

      <ol>
        {experiences.map((exp) => (
          <li
            key={exp.role}
            className="grid gap-x-12 gap-y-2 border-t border-line py-8 last:border-b md:grid-cols-[3fr_7fr]"
          >
            <p className="font-mono text-small text-muted-foreground tabular-nums">{exp.period}</p>
            <Reveal>
              <h3 className="text-h3 text-foreground">{exp.role}</h3>
              <p className="mt-1 text-small text-accent">{exp.company}</p>
              <ul className="mt-4 space-y-2">
                {exp.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-small text-muted-foreground">
                    <span className="font-mono text-faint" aria-hidden="true">
                      —
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-label text-faint">
                {exp.tech.map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>
    </SectionContainer>
  );
}
