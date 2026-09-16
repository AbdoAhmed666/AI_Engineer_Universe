/**
 * Site footer.
 *
 * A single quiet row: copyright on one side, direct links on the other.
 * Links come from `siteConfig.social`, and the year is computed when the
 * page is rendered. Server component, no animation.
 *
 * @example
 * import { Footer } from "@/components/layout";
 *
 * <Footer />
 */

import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/constants";

/**
 * Props for the {@link Footer} component.
 */
export interface FooterProps {
  className?: string;
}

/**
 * Social link descriptor derived from `siteConfig.social`.
 */
interface SocialLink {
  label: string;
  href: string;
  external: boolean;
}

/**
 * Builds the list of social links from `siteConfig.social`, omitting any
 * entries that are not configured.
 */
function getSocialLinks(): SocialLink[] {
  const { social } = siteConfig;
  const links: SocialLink[] = [];
  if (social.github) {
    links.push({ label: "GitHub", href: social.github, external: true });
  }
  if (social.linkedin) {
    links.push({ label: "LinkedIn", href: social.linkedin, external: true });
  }
  if (social.email) {
    links.push({ label: "Email", href: `mailto:${social.email}`, external: false });
  }
  return links;
}

/**
 * Minimal site footer.
 *
 * @param props - Optional class name overrides.
 * @returns The rendered footer element.
 */
export function Footer({ className }: FooterProps): React.ReactElement {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("w-full border-t border-line", className)}>
      <div className="container-page flex flex-col gap-4 py-8 font-mono text-label text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {siteConfig.name}
        </p>
        <ul className="flex gap-6">
          {getSocialLinks().map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
