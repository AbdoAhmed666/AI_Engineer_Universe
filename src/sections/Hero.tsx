/**
 * Hero section.
 *
 * The opening statement: identity metadata in the narrow left column, the
 * positioning headline, lead and actions in the wide right column, and
 * below a hairline, a full-width schematic of the system architecture the
 * rest of the page documents.
 *
 * Still a server component. Its entrance is CSS — each block carries a
 * `motion-lift` class and its place in the schedule, so the heading, lead
 * and actions are readable and clickable from the first paint and move by
 * transform only. The single client boundary is `BootInView`, which holds
 * the schematic's BOOT until the band is on screen.
 *
 * The schematic band carries both renderings of the same pipeline data:
 * the SVG schematic always, and the 3D Signal Path drawn over it wherever
 * the device can actually run it. `SystemVisualization` owns that decision
 * and the schematic never leaves the DOM, so the band degrades to exactly
 * what it is today whenever the scene cannot or should not run.
 *
 * @example
 * import { Hero } from "@/sections";
 *
 * export default function Page() {
 *   return <Hero />;
 * }
 */

import Image from "next/image";
import { SectionContainer } from "@/components/common";
import { BootInView } from "@/components/motion";
import {
  SystemSchematic,
  SystemVisualization,
  WorldOverlay,
} from "@/components/system";
import { Button } from "@/components/ui";
import { siteConfig } from "@/lib/constants";
import { bootSequence, heroDelay, motionVars } from "@/lib/animations";

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
  /** Absolute URL or `mailto:` address the link points to. */
  href: string;
  /** Whether the link leaves the site. */
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
    links.push({
      label: "Email",
      href: `mailto:${social.email}`,
      external: false,
    });
  }
  return links;
}

/**
 * Schedules one block of the Hero entrance.
 *
 * @param block - Zero-based index of the block, top to bottom.
 */
function entrance(block: number): React.CSSProperties {
  return motionVars(heroDelay(block)) as React.CSSProperties;
}

/**
 * Opening section of the portfolio.
 *
 * @param props - Hero section configuration.
 * @returns The rendered hero section.
 */
export function Hero({ id = "home" }: HeroProps): React.ReactElement {
  const socialLinks = getSocialLinks();

  return (
    <SectionContainer id={id} aria-label="Introduction" divider={false}>
      <div className="grid gap-x-12 gap-y-8 md:grid-cols-[3fr_7fr]">
        {/* ── Identity column ── */}
        <div className="motion-lift md:pt-3" style={entrance(0)}>
          {/*
            The portrait leads the identity column so it is clear whose site
            this is before anything else is read. The source photograph is a
            wide, full-length shot, so the image is scaled up and anchored to
            its top edge to frame the head rather than the whole scene.
          */}
          <div className="relative mb-5 aspect-[4/5] w-32 overflow-hidden rounded-lg border border-line">
            <Image
              src="/me.jpg"
              alt={siteConfig.author.name}
              fill
              sizes="272px"
              priority
              className="origin-top scale-[1.65] object-cover object-[46%_top]"
            />
          </div>
          <p className="font-mono text-small text-foreground">
            {siteConfig.author.name}
          </p>
          <p className="eyebrow mt-1">Alexandria, Egypt</p>
          <p className="mt-5 max-w-[34ch] text-small text-muted-foreground">
            Open to AI engineering roles, freelance projects, and
            collaborations.
          </p>
        </div>

        {/* ── Statement column ── */}
        <div>
          <h1
            className="motion-lift text-display text-balance text-foreground"
            style={entrance(1)}
          >
            AI Engineer <span className="text-faint">&amp;</span> System Builder
          </h1>

          <p
            className="motion-lift mt-7 max-w-[58ch] text-lead text-muted-foreground"
            style={entrance(2)}
          >
            I build production LLM systems end to end — grounded retrieval,
            structured evaluation, and the FastAPI services and persistence
            underneath. Deep learning too: a BiLSTM gesture recognizer at 98%
            accuracy on wearable IMU sensors.
          </p>

          <div className="motion-lift mt-10 flex flex-wrap gap-3" style={entrance(3)}>
            <Button href="#projects" size="lg">
              View projects
            </Button>
            <Button href="#contact" variant="outline" size="lg">
              Get in touch
            </Button>
          </div>

          {/*
            The way into the 3D city. Rendered only where the scene can
            actually run, so it never promises something the device cannot
            deliver — and the project cards carry the same work regardless.
          */}
          <div className="motion-lift mt-8 max-w-[34rem]" style={entrance(4)}>
            <WorldOverlay label="Enter the world" />
          </div>

          {socialLinks.length > 0 && (
            <ul
              className="motion-lift mt-10 flex flex-wrap items-center gap-x-6 gap-y-2"
              style={entrance(5)}
            >
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="font-mono text-small text-muted-foreground transition-colors hover:text-accent"
                  >
                    {link.label}
                    {link.external && <span aria-hidden="true"> ↗</span>}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/*
        System schematic. The rule is an element rather than a border so it
        can draw itself, and BOOT waits until the band is actually on screen
        — it sits below the fold at every common viewport.
      */}
      <div className="mt-20 sm:mt-28">
        {/* Part of the Hero's own entrance, so it is never held. */}
        <div
          aria-hidden="true"
          className="motion-rule h-px w-full bg-line"
          style={
            motionVars(
              heroDelay(2),
              bootSequence.rail
            ) as React.CSSProperties
          }
        />
        <BootInView>
          {/*
            `SystemVisualization` sits inside the BOOT gate rather than
            around it: the gate belongs to the band's place in the page,
            while the scene belongs to the drawing it is laid over. Both
            locate that drawing through the same `[data-boot-anchor]`, and
            the wrapper's `position: relative` makes it the offset parent
            the overlay is measured against.
          */}
          <SystemVisualization>
            <SystemSchematic className="pt-10 sm:pt-12" />
          </SystemVisualization>
        </BootInView>
      </div>
    </SectionContainer>
  );
}

export default Hero;
