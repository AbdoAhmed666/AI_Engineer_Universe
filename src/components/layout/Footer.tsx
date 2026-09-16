/**
 * Site footer layout component.
 *
 * A responsive, dark-mode-aware footer. Renders the site name and
 * description (from `siteConfig`), a set of optional navigation links,
 * social links derived from `siteConfig.social`, and a copyright line
 * computed from the current year. The layout stacks vertically on small
 * screens and expands to a multi-column grid on larger viewports.
 *
 * All colors use semantic CSS variables (e.g. `text-foreground`,
 * `text-muted-foreground`, `border-border`) so the footer adapts
 * automatically to light and dark themes.
 *
 * @example
 * import { Footer } from "@/components/layout";
 *
 * export default function Page() {
 *   return <Footer />;
 * }
 */

"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/constants";
import { fadeVariants } from "@/lib/animations";
import type { NavLink } from "./Header";

/**
 * Props for the {@link Footer} component.
 */
export interface FooterProps extends HTMLMotionProps<"footer"> {
  /** Optional navigation links rendered in the footer nav column. */
  links?: NavLink[];
  /** When true, renders the social links column. Defaults to `true`. */
  showSocial?: boolean;
}

/**
 * Default navigation links used when no `links` prop is supplied.
 */
const defaultLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

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
  if (social.twitter) {
    links.push({ label: "Twitter", href: social.twitter });
  }
  if (social.email) {
    links.push({ label: "Email", href: `mailto:${social.email}` });
  }
  return links;
}

/**
 * Responsive site footer with social links.
 *
 * @param props - Footer configuration and native footer attributes.
 * @returns The rendered footer element.
 */
export const Footer = forwardRef<HTMLElement, FooterProps>(
  (
    { className, links = defaultLinks, showSocial = true, ...props },
    ref
  ) => {
        const socialLinks = getSocialLinks();

    return (
      <motion.footer
        ref={ref}
        role="contentinfo"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeVariants}
        className={cn(
          "w-full border-t border-border/40 bg-background",
          className
        )}
        {...props}
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Brand + description */}
            <div className="flex flex-col gap-2">
              <span className="text-base font-semibold tracking-tight text-foreground">
                {siteConfig.name}
              </span>
              <p className="max-w-xs text-sm text-muted-foreground">
                {siteConfig.description}
              </p>
            </div>

            {/* Navigation */}
            <nav aria-label="Footer" className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-foreground">
                Navigation
              </span>
              <ul className="flex flex-col gap-1">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Social */}
            {showSocial && socialLinks.length > 0 && (
              <nav aria-label="Social" className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Social
                </span>
                <ul className="flex flex-col gap-1">
                  {socialLinks.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          {/* Copyright */}
          <div className="mt-8 border-t border-border/40 pt-6">
                        <p className="text-center text-xs text-muted-foreground sm:text-left">
              © 2025 Abdelrhman Ahmed
            </p>
          </div>
        </div>
      </motion.footer>
    );
  }
);

Footer.displayName = "Footer";