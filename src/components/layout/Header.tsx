/**
 * Site header.
 *
 * A quiet sticky navigation bar: a mono name mark, section links and, on
 * small screens, a disclosure menu. The bar is transparent at the top of
 * the page and gains a hairline border and a solid backdrop once the page
 * scrolls. The scroll progress line sits on its bottom edge.
 *
 * Client component: it tracks scroll position and the mobile menu state.
 *
 * @example
 * import { Header } from "@/components/layout";
 *
 * <Header />
 */

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { cn } from "@/lib/utils";
import { siteConfig, zIndex } from "@/lib/constants";
import { ScrollProgress } from "./ScrollProgress";

/**
 * A single navigation entry rendered by the {@link Header}.
 */
export interface NavLink {
  /** Visible label for the link. */
  label: string;
  /** In-page anchor or URL the link points to. */
  href: string;
}

/**
 * Props for the {@link Header} component.
 */
export interface HeaderProps {
  /** Optional navigation links. Defaults to the page sections. */
  links?: NavLink[];
  className?: string;
}

/**
 * Default navigation links used when no `links` prop is supplied.
 */
const defaultLinks: NavLink[] = [
  { label: "About", href: "#about" },
  { label: "Stack", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

/** Scroll distance (px) after which the header shows its border and backdrop. */
const SCROLLED_THRESHOLD = 8;

/**
 * Responsive sticky site header.
 *
 * @param props - Navigation links and optional class name.
 * @returns The rendered header element.
 */
export function Header({
  links = defaultLinks,
  className,
}: HeaderProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (value) => {
    setIsScrolled(value > SCROLLED_THRESHOLD);
  });

  // Close the mobile menu with Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const isSolid = isScrolled || isOpen;

  return (
    <header
      className={cn(
        "sticky top-0 w-full border-b transition-colors duration-300",
        isSolid
          ? "border-line bg-background/85 backdrop-blur-md"
          : "border-transparent bg-transparent",
        className
      )}
      style={{ zIndex: zIndex.sticky }}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <a
          href="#home"
          className="font-mono text-small text-foreground"
          aria-label={`${siteConfig.name}, back to top`}
        >
          {siteConfig.name}
          <span className="text-faint"> / AI Engineer</span>
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-small text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="header-mobile-nav"
          onClick={() => setIsOpen((prev) => !prev)}
          className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground md:hidden"
        >
          <MenuIcon open={isOpen} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.nav
            id="header-mobile-nav"
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-line md:hidden"
          >
            <ul className="container-page flex flex-col py-3">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block py-3 text-body text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>

      <ScrollProgress />
    </header>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

/**
 * Two-line menu / close icon. Switches glyph based on `open`.
 */
function MenuIcon({ open }: { open: boolean }): React.ReactElement {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
    >
      {open ? (
        <>
          <line x1={18} y1={6} x2={6} y2={18} />
          <line x1={6} y1={6} x2={18} y2={18} />
        </>
      ) : (
        <>
          <line x1={4} y1={9} x2={20} y2={9} />
          <line x1={4} y1={15} x2={20} y2={15} />
        </>
      )}
    </svg>
  );
}
