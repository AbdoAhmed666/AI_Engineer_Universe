'use client'

import { motion } from 'framer-motion'

const skillGroups = [
  {
    category: 'AI / Machine Learning',
    skills: ['Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Keras', 'Scikit-learn', 'Computer Vision', 'NLP', 'BiLSTM'],
  },
  {
    category: 'LLM / Generative AI',
    skills: ['LLMs', 'Generative AI', 'RAG', 'Embeddings', 'FAISS', 'LangChain', 'Prompt Engineering', 'Quantization'],
  },
  {
    category: 'Backend / Systems',
    skills: ['Python', 'FastAPI', 'REST APIs', 'SQLAlchemy', 'Alembic', 'Pydantic', 'JWT Auth', 'SQL'],
  },
  {
    category: 'Frontend',
    skills: ['Next.js', 'React', 'TypeScript'],
  },
  {
    category: 'Databases',
    skills: ['PostgreSQL', 'SQLite', 'FAISS'],
  },
  {
    category: 'Deployment / Tools',
    skills: ['Docker', 'Azure', 'Railway', 'Git', 'GitHub', 'Vercel'],
  },
]

export default function Skills() {
  return (
    <motion.div
      id="skills"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-24 bg-slate-950/30"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs tracking-widest text-ballet-blue">
            TECHNICAL STACK
          </p>
          <h2 className="text-3xl font-semibold mb-12">
            Tools I Build With
          </h2>
        </div>

        <div className="space-y-8">
                    {skillGroups.map((group, index) => (
            <div key={group.category} className={index === 0 ? "" : "border-t border-white/5 pt-6"}>
              <p className="text-xs font-semibold tracking-widest uppercase text-ballet-blue mb-3 mt-8 first:mt-0">
                {group.category}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex rounded-full px-3 py-1 text-xs border border-white/10 bg-slate-900/60 text-slate-300 hover:border-ballet-blue/40 hover:text-ballet-blue transition-colors cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
