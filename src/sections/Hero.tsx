/**
 * Hero section — premium AI Engineer landing page.
 *
 * A modern, product-inspired hero with large gradient typography, an
 * animated availability badge, a live "AI system" status panel with
 * pulsing capability indicators, glassmorphism feature cards, an
 * animated blurred background, and a refined CTA layout.
 * All content is sourced from `siteConfig` and all animations use shared
 * Framer Motion variants from `@/lib/animations`.
 *
 * @example
 * import { Hero } from "@/sections";
 *
 * export default function Page() {
 *   return <Hero />;
 * }
 */

"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { GitBranch, User, Mail } from "lucide-react";
import { SectionContainer } from "@/components/common";
import { Button } from "@/components/ui";
import { siteConfig } from "@/lib/constants";
import {
  staggerContainer,
  staggerItem,
  transitions,
  hoverScale,
  tapScale,
} from "@/lib/animations";

/**
 * Props for the {@link Hero} section.
 */
export interface HeroProps {
  /** Optional id for the section anchor. Defaults to `"home"`. */
  id?: string;
}

/**
 * Social link descriptor derived from `siteConfig.social`.
 */
interface SocialLink {
  /** Visible label for the link. */
  label: string;
  /** Absolute URL the link points to. */
  href: string;
}

/**
 * Descriptor for a glassmorphism feature card.
 */
interface FeatureCard {
  /** Icon element rendered in the card. */
  icon: React.ReactElement;
  /** Card title. */
  title: string;
  /** Card description. */
  description: string;
}

/**
 * Descriptor for a capability row in the AI status panel.
 */
interface Capability {
  /** Human-readable label for the capability. */
  label: string;
  /** Current status text shown on the right. */
  status: string;
}

/**
 * Builds the list of social links from `siteConfig.social`, omitting any
 * entries that are not configured.
 */
function getSocialLinks(): SocialLink[] {
  const { social } = siteConfig;
  const links: SocialLink[] = [];
  if (social.github) {
    links.push({ label: "GitHub", href: social.github });
  }
  if (social.linkedin) {
    links.push({ label: "LinkedIn", href: social.linkedin });
  }
  if (social.email) {
    links.push({ label: "Email", href: `mailto:${social.email}` });
  }
  return links;
}

/**
 * Maps social link labels to their corresponding Lucide icons.
 */
const socialIcons: Record<string, React.ElementType> = {
  GitHub: GitBranch,
  LinkedIn: User,
  Email: Mail,
};

// ─── Animation Variants ──────────────────────────────────────────────────────

/**
 * Badge pulse animation for the availability indicator.
 */
const badgePulse: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// ─── Static Content ──────────────────────────────────────────────────────────

/**
 * Glassmorphism feature cards highlighting AI engineering capabilities.
 */
const features: FeatureCard[] = [
  {
    icon: <BrainIcon className="h-6 w-6" />,
    title: "LLM Applications",
    description:
      "Designing and deploying production-grade LLM applications with robust evaluation pipelines.",
  },
  {
    icon: <NetworkIcon className="h-6 w-6" />,
    title: "RAG & Agents",
    description:
      "Building retrieval-augmented systems and autonomous agents that reason over private data.",
  },
  {
    icon: <CodeIcon className="h-6 w-6" />,
    title: "Production ML",
    description:
      "Shipping end-to-end AI systems — from model orchestration to scalable, monitored deployments.",
  },
];

/**
 * Active AI capabilities shown in the live status panel.
 */
const capabilities: Capability[] = [
  { label: "RAG Pipeline", status: "active" },
  { label: "LLM Reasoning", status: "active" },
  { label: "Voice AI", status: "online" },
  { label: "Agent System", status: "running" },
];

/**
 * Animated hero section for the AI Engineer portfolio.
 *
 * @param props - Hero section configuration.
 * @returns The rendered hero section.
 */
export function Hero({ id = "home" }: HeroProps): React.ReactElement {
  const socialLinks = getSocialLinks();

  return (
    <SectionContainer
      id={id}
      aria-label="Introduction"
      divider={false}
      className="relative flex min-h-[90vh] items-center overflow-hidden py-16 sm:py-24"
    >
      {/* Animated background blur */}
      <AnimatedBackgroundBlur />

      {/* Main content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
                className="relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2"
      >
        {/* ── Text Column ── */}
        <div className="flex flex-col items-start">
          {/* Animated availability badge */}
          <motion.div variants={badgePulse} className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Available for AI engineering roles
            </div>
          </motion.div>

          {/* Name */}
          <motion.h1
            variants={staggerItem}
            className="text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
              {siteConfig.author.name}
            </span>
          </motion.h1>

          {/* AI Engineer title with gradient accent */}
          <motion.p
            variants={staggerItem}
            className="mt-4 text-2xl font-semibold sm:text-3xl lg:text-4xl"
          >
            <span className="bg-gradient-to-r from-ballet-blue via-ballet-blue to-ballet-blue/70 bg-clip-text text-transparent">
              AI Engineer
            </span>
          </motion.p>

          {/* Short introduction */}
          <motion.p
            variants={staggerItem}
            className="mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            {siteConfig.description}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={staggerItem}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-5"
          >
            <Button
              variant="primary"
              size="lg"
              className="bg-ballet-blue hover:bg-ballet-blue/90"
              onClick={() => scrollToAnchor("#projects")}
            >
              View Projects
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border border-white/20 hover:border-ballet-blue/60 hover:text-ballet-blue transition-colors duration-200"
              onClick={() => scrollToAnchor("#contact")}
            >
              Get in Touch
            </Button>
          </motion.div>

          {/* Social links */}
          {socialLinks.length > 0 && (
            <motion.ul
              variants={staggerItem}
              className="mt-10 flex flex-wrap items-center gap-6"
            >
              {socialLinks.map((link) => {
                const Icon = socialIcons[link.label];
                return (
                  <li key={link.href}>
                    <motion.a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={hoverScale}
                      whileTap={tapScale}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-ballet-blue transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Icon size={15} />
                      <span>{link.label}</span>
                    </motion.a>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </div>

        {/* ── AI System Status Panel (right side) ── */}
                        <div className="hidden lg:flex justify-center items-center w-full">
          <AiStatusPanel />
        </div>
            </motion.div>
    </SectionContainer>
  );
}

// ─── Animated Background Blur ────────────────────────────────────────────────

/**
 * Decorative animated blurred gradient orbs behind the hero content.
 */
function AnimatedBackgroundBlur(): React.ReactElement {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-ballet-blue/20 blur-[120px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ ...transitions.slow, repeat: Infinity }}
      />
      <motion.div
        className="absolute right-[10%] top-[30%] h-[400px] w-[400px] rounded-full bg-ballet-blue/10 blur-[100px]"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ ...transitions.slow, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute left-[10%] bottom-[10%] h-[350px] w-[350px] rounded-full bg-ballet-blue/10 blur-[90px]"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{ ...transitions.slow, repeat: Infinity, delay: 1 }}
      />
    </div>
  );
}

// ─── AI Status Panel ────────────────────────────────────────────────────────

/**
 * A single cohesive status panel representing the live AI system.
 *
 * Renders a bordered card with a header ("AI ENGINE" / "ONLINE") and a
 * vertical list of capability rows. Each row shows a pulsing green status
 * dot, a capability label, and a right-aligned status text. This replaces
 * the previous scattered floating badges with one designed component.
 */
function AiStatusPanel(): React.ReactElement {
  return (
    <motion.div
      className="border border-white/10 bg-slate-900/60 backdrop-blur-sm rounded-xl p-6 shadow-xl"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-xs font-medium tracking-wider text-muted-foreground">
          AI ENGINE
        </span>
        <span className="text-xs font-medium text-emerald-400">ONLINE</span>
      </div>

      {/* Capability rows */}
      <div className="flex flex-col gap-3">
        {capabilities.map((cap) => (
          <div
            key={cap.label}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-sm font-medium text-foreground">
                {cap.label}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{cap.status}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Smoothly scrolls to a target anchor selector.
 *
 * @param selector - A CSS selector (e.g. `"#projects"`) to scroll to.
 */
function scrollToAnchor(selector: string): void {
  if (typeof window === "undefined") return;
  const target = document.querySelector<HTMLElement>(selector);
  if (target) {
    target.scrollIntoView({ behavior: "smooth" });
  }
}

// ─── Icons ───────────────────────────────────────────────────────────────────

/**
 * Chevron-down icon used by the scroll indicator.
 */
function ChevronDownIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Brain icon for the "LLM Applications" feature card.
 */
function BrainIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

/**
 * Network icon for the "RAG & Agents" feature card.
 */
function NetworkIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x={2} y={2} width={20} height={20} rx={2.5} />
      <path d="M2 9.5c4-1 6-4 10-4s6 3 10 4" />
      <path d="M2 14.5c4-1 6-4 10-4s6 3 10 4" />
      <path d="M6 2v6" />
      <path d="M18 2v6" />
    </svg>
  );
}

/**
 * Code icon for the "Production ML" feature card.
 */
function CodeIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

export default Hero;
