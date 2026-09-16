'use client'

import { motion } from 'framer-motion'
import { GitBranch, ExternalLink, CheckCircle2 } from 'lucide-react'

const projects = [
  {
    name: 'AI Interview Agent',
    tag: 'Full-Stack AI Application',
    description:
      'Production-grade AI technical interview platform using LLMs and RAG. Generates role-specific adaptive questions, evaluates answers with structured LLM scoring, and produces personalized feedback with hiring recommendations.',
    capabilities: [
      'Role-specific adaptive interview questions via LLMs',
      'LLM evaluation pipeline: scoring, feedback, knowledge-gap detection',
      'RAG pipeline with FAISS for context-aware personalization',
      'JWT authentication, session management, interview history',
      'Analytics dashboard and PDF report generation',
      'FastAPI backend + Next.js frontend, PostgreSQL persistence',
    ],
    tech: ['FastAPI', 'Next.js', 'PostgreSQL', 'LangChain', 'FAISS', 'OpenAI', 'Docker', 'TypeScript'],
    github: 'https://github.com/AbdoAhmed666/AI-Interview-Agent',
    demo: null,
  },
  {
    name: 'AI Internal Knowledge Assistant',
    tag: 'RAG · LLM Infrastructure',
    description:
      'Internal knowledge assistant using RAG, embeddings, and FAISS retrieval to generate context-aware responses from a domain knowledge base. Optimized for CPU inference through INT8 quantization — reducing model size by 58.9% (293MB → 120MB).',
    capabilities: [
      'Modular RAG architecture: retrieval, generation, application layers',
      'FAISS vector retrieval with embedding-based semantic search',
      'FastAPI REST and streaming endpoints',
      'INT8 quantization: 58.9% model size reduction',
      'Docker-based deployment with documented latency trade-offs',
      'Tool-calling architecture with modular LLM orchestration',
    ],
    tech: ['Python', 'FastAPI', 'FAISS', 'LangChain', 'Docker', 'Quantization', 'REST API'],
    github: 'https://github.com/AbdoAhmed666/electro-pi-ai-internal-knowledge-assistant',
    demo: null,
  },
  {
    name: 'Real-Time Gesture Smart Home',
    tag: 'Graduation Project · Deep Learning · IoT',
    description:
      'Real-time gesture recognition system using a Bidirectional LSTM and wearable IMU sensors for accessibility-focused smart-home control. Achieved 98% recognition accuracy with 35% latency reduction.',
    capabilities: [
      '98% gesture recognition accuracy with BiLSTM + IMU sensors',
      '35% inference latency reduction through model optimization',
      'Real-time smart-home control for accessibility use cases',
      'End-to-end deployment on Railway and Azure',
      'Led 5-member development team through full project lifecycle',
      'TensorFlow/Keras training pipeline with IoT integration',
    ],
    tech: ['BiLSTM', 'TensorFlow', 'Keras', 'IoT', 'Azure', 'Railway', 'Python'],
    github: 'https://github.com/AbdoAhmed666',
    demo: null,
  },
]

export default function Projects() {
  return (
    <motion.div
      id="projects"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {projects.map((project) => (
          <div
            key={project.name}
            className="rounded-xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 mb-8"
          >
            <div className="lg:grid lg:grid-cols-[1fr_280px] gap-8">
              {/* Left side */}
              <div>
                <span className="text-xs text-ballet-blue border border-ballet-blue/30 rounded-full px-3 py-1 inline-block mb-3">
                  {project.tag}
                </span>
                <h3 className="text-xl font-semibold mb-3">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  {project.description}
                </p>
                <ul className="space-y-2">
                  {project.capabilities.map((cap) => (
                    <li
                      key={cap}
                      className="flex items-start gap-2 text-sm text-slate-300"
                    >
                      <CheckCircle2
                        size={14}
                        className="text-ballet-blue mt-0.5 shrink-0"
                      />
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right side */}
              <div>
                <p className="text-xs text-muted-foreground mb-3 tracking-wider uppercase">
                  Tech Stack
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full px-3 py-1 text-xs bg-slate-800 border border-white/8 text-slate-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <a
                  href={project.github}
                  className="flex items-center gap-2 text-sm border border-white/20 rounded-lg px-4 py-2 hover:border-ballet-blue/40 hover:text-ballet-blue transition-colors w-full justify-center mb-2"
                >
                  <GitBranch size={15} />
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
