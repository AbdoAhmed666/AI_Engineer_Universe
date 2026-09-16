/**
 * Section heading.
 *
 * The shared header for page sections: a mono path label that mirrors the
 * section's anchor (`/about`), the `<h2>` title and an optional intro. On
 * wide screens the path sits in a narrow left column and the title block in
 * the wide right column; on small screens they stack.
 *
 * @example
 * <SectionHeading
 *   section="about"
 *   title="I think in systems, not in models."
 *   intro="A model is one component..."
 * />
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Props for the {@link SectionHeading} component.
 */
export interface SectionHeadingProps {
  /** Section anchor id. Renders the `/section` path and the `${section}-title` heading id. */
  section: string;
  /** Section title. */
  title: ReactNode;
  /** Optional supporting paragraph under the title. */
  intro?: ReactNode;
  className?: string;
}

/**
 * Path label, title and intro for a page section.
 *
 * @param props - Heading content.
 * @returns The rendered heading block.
 */
export function SectionHeading({
  section,
  title,
  intro,
  className,
}: SectionHeadingProps): React.ReactElement {
  return (
    <div
      className={cn(
        "mb-10 grid gap-x-12 gap-y-4 sm:mb-16 md:grid-cols-[3fr_7fr]",
        className
      )}
    >
      <p className="pt-2 font-mono text-small text-accent" aria-hidden="true">
        /{section}
      </p>
      <div>
        <h2 id={`${section}-title`} className="text-h2 text-balance text-foreground">
          {title}
        </h2>
        {intro && (
          <p className="mt-4 max-w-[58ch] text-body text-muted-foreground">
            {intro}
          </p>
        )}
      </div>
    </div>
  );
}
