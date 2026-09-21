/**
 * Application-wide constants.
 * Centralized configuration for site metadata, motion timing, and stacking.
 */

// ─── Site Configuration ──────────────────────────────────────────────────

import type { SiteConfig } from "./types";

export const siteConfig: SiteConfig = {
  name: "Abdelrhman Ahmed",
  title: "Abdelrhman Ahmed — AI Engineer",
  description:
    "AI Engineer building production-grade systems with LLMs, RAG, agents, and machine learning.",
  url: "https://abdoahmed666.github.io",
  author: {
    name: "Abdelrhman Ahmed",
    email: "abdoibrahim122000@gmail.com",
  },
  social: {
    github: "https://github.com/AbdoAhmed666",
    linkedin: "https://www.linkedin.com/in/abdelrhman-ahmed-92a432260",
    email: "abdoibrahim122000@gmail.com",
  },
};

// ─── Animation Durations (ms) ────────────────────────────────────────────

export const animationDuration = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800,
} as const;

// ─── Animation Easings ───────────────────────────────────────────────────

export const easings = {
  standard: [0.4, 0, 0.2, 1],
  emphasized: [0.2, 0, 0, 1],
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1],
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
} as const;

// ─── Z-Index Scale ───────────────────────────────────────────────────────

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
} as const;
