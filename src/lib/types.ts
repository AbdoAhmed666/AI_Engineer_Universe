/**
 * Shared type definitions for the portfolio application.
 * These types are used across components
 * to ensure type safety throughout the codebase.
 */

import type { HTMLMotionProps } from "framer-motion";

// ─── Components ──────────────────────────────────────────────────────────

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

// ─── Site Metadata ───────────────────────────────────────────────────────

export interface SiteConfig {
  name: string;
  title: string;
  description: string;
  url: string;
  author: {
    name: string;
    email: string;
  };
  social: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    email?: string;
  };
}

