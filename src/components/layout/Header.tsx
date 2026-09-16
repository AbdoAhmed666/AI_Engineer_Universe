/**
 * Site header layout component.
 *
 * A responsive, dark-mode-aware navigation header. Renders the site name
 * (from `siteConfig`) and a set of navigation links. The layout collapses to a
 * simplified, icon-forward arrangement on small screens and expands to a
 * full horizontal nav bar on larger viewports.
 *
 * The component is a client component because it manages the mobile menu
 * open state.
 *
 * @example
 * import { Header } from "@/components/layout";
 *
 * export default function Page() {
 *   return <Header />;
 * }
 */

"use client";

import { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { siteConfig, zIndex } from "@/lib/constants";
import { slideDownVariants } from "@/lib/animations";

/**
 * A single navigation entry rendered by the {@link Header}.
 */
export interface NavLink {
  /** Visible label for the link. */
  label: string;
  /** URL or in-page anchor the link points to. */
  href: string;
}

/**
 * Props for the {@link Header} component.
 */
export interface HeaderProps extends HTMLMotionProps<"header"> {
  /** Optional navigation links. Defaults to a standard portfolio set. */
  links?: NavLink[];
  /** When true, the header sticks to the top of the viewport. */
  sticky?: boolean;
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
 * Responsive site header.
 *
 * @param props - Header configuration and native header attributes.
 * @returns The rendered header element.
 */
export const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ className, links = defaultLinks, sticky = true, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <motion.header
        ref={ref}
        role="banner"
        initial="hidden"
        animate="visible"
        variants={slideDownVariants}
        className={cn(
          "w-full border-b border-border/40 bg-background/70 backdrop-blur-md",
          "supports-[backdrop-filter]:bg-background/60",
          sticky && "sticky top-0",
          className
        )}
        style={{ zIndex: zIndex.sticky }}
        {...props}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <a
            href="#home"
            className="text-base font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80 sm:text-lg"
            aria-label={`${siteConfig.name} — home`}
          >
            {siteConfig.name}
          </a>

          {/* Desktop navigation */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "group relative rounded-md px-3 py-2 text-sm font-medium",
                  "text-muted-foreground transition-colors",
                  "hover:text-foreground focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  "focus-visible:ring-offset-2"
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute inset-x-0 -bottom-px h-px",
                    "bg-gradient-to-r from-primary via-transparent to-primary",
                    "opacity-0 transition-opacity duration-300",
                    "group-hover:opacity-60"
                  )}
                />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            <button
              type="button"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="header-mobile-nav"
              onClick={() => setIsOpen((prev) => !prev)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-md",
                "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                "transition-colors focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring",
                "focus-visible:ring-offset-2",
                "md:hidden"
              )}
            >
              <MenuIcon open={isOpen} />
            </button>
          </div>
        </div>

        {/* Mobile navigation panel */}
        {isOpen && (
          <motion.nav
            id="header-mobile-nav"
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="border-t border-border/40 bg-background md:hidden"
          >
            <ul className="mx-auto flex w-full max-w-7xl flex-col px-4 py-2 sm:px-6">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm font-medium",
                      "text-muted-foreground transition-colors",
                      "hover:bg-raised hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2",
                      "focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </motion.header>
    );
  }
);

Header.displayName = "Header";

// ─── Icons ───────────────────────────────────────────────────────────────────

/**
 * Hamburger / close menu icon. Switches between two glyphs based on `open`.
 */
function MenuIcon({ open }: { open: boolean }): React.ReactElement {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {open ? (
        <>
          <line x1={18} y1={6} x2={6} y2={18} />
          <line x1={6} y1={6} x2={18} y2={18} />
        </>
      ) : (
        <>
          <line x1={3} y1={12} x2={21} y2={12} />
          <line x1={3} y1={6} x2={21} y2={6} />
          <line x1={3} y1={18} x2={21} y2={18} />
        </>
      )}
    </svg>
  );
}
