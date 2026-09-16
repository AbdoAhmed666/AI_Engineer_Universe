'use client'

import { motion } from 'framer-motion'
import { Mail, User, GitBranch } from 'lucide-react'
import { siteConfig } from '@/lib/constants'

const { social } = siteConfig

const contacts = [
  { icon: Mail, label: 'Email', href: `mailto:${social.email}`, display: social.email },
  { icon: User, label: 'LinkedIn', href: social.linkedin ?? '#', display: 'linkedin.com/in/abdelrhman-ahmed' },
  { icon: GitBranch, label: 'GitHub', href: social.github ?? '#', display: 'github.com/AbdoAhmed666' },
]

export default function Contact() {
  return (
    <motion.div
      id="contact"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-24"
    >
      <div className="mx-auto w-full max-w-lg px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs tracking-widest text-ballet-blue mb-4">
          CONTACT
        </p>
        <h2 className="text-3xl font-semibold mb-4">
          Let's Work Together
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-10">
          Open to AI engineering roles, freelance projects, and collaborations.
          If you're building something with LLMs, RAG, or ML — I'd like to hear about it.
        </p>

        <div className="flex flex-col">
          {contacts.map((contact) => (
            <a
              key={contact.label}
              href={contact.href}
              className="flex items-center gap-3 w-full rounded-lg border border-white/10 bg-slate-900/40 px-5 py-4 mb-3 hover:border-ballet-blue/40 hover:bg-slate-900/60 transition-all duration-200 text-sm text-slate-300 hover:text-ballet-blue"
            >
              <contact.icon size={16} className="text-ballet-blue shrink-0" />
              <span className="font-medium">{contact.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {contact.display}
              </span>
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
