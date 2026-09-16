/**
 * Shared type definitions for the portfolio application.
 * These types are used across components, hooks, and contexts
 * to ensure type safety throughout the codebase.
 */

import type { Easing, HTMLMotionProps } from "framer-motion";

// ─── Components ──────────────────────────────────────────────────────────

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

// ─── 3D Scene ────────────────────────────────────────────────────────────

export interface SceneProps {
  className?: string;
  cameraPosition?: [number, number, number];
  enableControls?: boolean;
  enableAutoRotate?: boolean;
  children?: React.ReactNode;
}

export interface CanvasConfig {
  camera: {
    position: [number, number, number];
    fov: number;
    near: number;
    far: number;
  };
  dpr: number | [number, number];
  antialias: boolean;
  preserveDrawingBuffer: boolean;
}

// ─── Animation ───────────────────────────────────────────────────────────

export type AnimationVariant =
  | "fade"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scale"
  | "bounce"
  | "stagger";

export interface AnimationOptions {
  delay?: number;
  duration?: number;
  ease?: Easing | Easing[];
  once?: boolean;
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

// ─── Responsive ──────────────────────────────────────────────────────────

export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

export interface ResponsiveValue<T> {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
}
