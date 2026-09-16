'use client'

import { motion } from 'framer-motion'

const experiences = [
  {
    role: 'Data Scientist & AI Instructor',
    company: 'Arabian Academy',
    period: 'Jul 2025 – Sep 2025',
    bullets: [
      'Delivered advanced AI and Data Science training to 50+ college students',
      'Supervised 10+ projects across Computer Vision, NLP, and LLM applications — contributing to 5 published prototypes',
      'Developed project-based materials that increased class participation by 60% and retention by 25%',
    ],
    tech: ['Machine Learning', 'Computer Vision', 'NLP', 'LLMs', 'Python'],
  },
  {
    role: 'AI Instructor',
    company: 'I School Egypt',
    period: 'Mar 2025 – Aug 2025',
    bullets: [
      'Delivered 20+ practical AI and Python workshops to 100+ students',
      'Used coding and project-based learning methodology',
    ],
    tech: ['Python', 'AI', 'Workshops'],
  },
  {
    role: 'AI & Machine Learning Coach',
    company: 'Elharefa & Digital Egypt Pioneers Initiative (EDPI)',
    period: 'Oct 2024 – Jul 2025',
    bullets: [
      'Mentored 90+ students in Machine Learning and AI Engineering through project-based development',
      'Guided trainees through model development, evaluation, and deployment workflows',
      'Supported 80%+ of trainees in achieving freelance or remote work opportunities',
    ],
    tech: ['Machine Learning', 'AI Engineering', 'Model Deployment', 'Python'],
  },
  {
    role: 'AI & Data Science Instructor',
    company: 'YAT Learning Centers',
    period: 'Feb 2025',
    bullets: [
      'Delivered introductory AI and Data Science training with Python',
      'Connected Machine Learning concepts to practical applications',
    ],
    tech: ['Python', 'Machine Learning', 'Data Science'],
  },
]

export default function Experience() {
  return (
    <motion.div
      id="experience"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative pl-8 border-l border-white/10">
          {experiences.map((exp) => (
            <div
              key={exp.role}
              className="relative mb-12 last:mb-0"
            >
              {/* Timeline dot */}
              <div className="absolute -left-[17px] w-3 h-3 rounded-full bg-ballet-blue ring-2 ring-ballet-blue/20" />

              {/* Entry content */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 tracking-wide">
                  {exp.period}
                </p>
                <h3 className="text-lg font-semibold text-foreground">
                  {exp.role}
                </h3>
                <p className="text-sm text-ballet-blue mb-4">{exp.company}</p>
                <ul className="space-y-2">
                  {exp.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-ballet-blue mt-0.5">—</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 mt-4">
                  {exp.tech.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-2.5 py-0.5 rounded-full border border-white/10 bg-slate-900/40 text-slate-400"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
