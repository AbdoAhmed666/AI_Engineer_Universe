'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Brain, Database, Bot, Layers } from 'lucide-react'

const highlights = [
  { icon: Brain, title: 'LLMs', desc: 'GPT-4, Claude, Gemini, open-source models' },
  { icon: Database, title: 'RAG Systems', desc: 'Vector search, chunking, reranking' },
  { icon: Bot, title: 'Agents', desc: 'Tool use, planning, multi-step reasoning' },
  { icon: Layers, title: 'Full-Stack', desc: 'FastAPI, Next.js, PostgreSQL, Docker' },
]

export default function About() {
  return (
    <motion.div
      id="about"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
          {/* Left side */}
          <div>
            <div className="mb-8">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <Image
                  src="/me.jpg"
                  alt="Abdelrhman Ahmed"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>
            <p className="text-xs tracking-widest text-ballet-blue font-medium mb-4">
              ABOUT
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground mb-6">
              Building AI Systems That Work in the Real World
                                                            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4 text-sm sm:text-base">
              I'm an AI Engineer specializing in end-to-end AI applications — from LLM pipelines
              and RAG systems to deep learning models and scalable backends. My work spans
              the full stack: Python, FastAPI, FAISS, LangChain, PostgreSQL, and Next.js.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4 text-sm sm:text-base">
              I've built adaptive interview agents, internal knowledge assistants, and
              gesture-recognition systems deployed in production. I care about systems that
              actually work: grounded retrieval, measurable evaluation, and deployment-ready
              architecture — not just demos.
            </p>
            <p className="text-xs text-muted-foreground mt-6 border-t border-white/8 pt-4">
              B.S. Computing and Data Science — Alexandria, 2025 · HCIA-AI Certified (Huawei/NTI)
            </p>
          </div>

          {/* Right side — 2x2 grid of highlight cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((item) => (
                          <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-slate-900/50 p-5 hover:border-ballet-blue/30 hover:bg-slate-900/70 transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-lg bg-ballet-blue/10 flex items-center justify-center mb-3 group-hover:bg-ballet-blue/15 transition-colors">
                  <item.icon size={18} className="text-ballet-blue" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
