/**
 * Section container.
 *
 * The outer wrapper for every page section: a semantic `<section>` with an
 * anchor id, consistent vertical rhythm, a hairline divider and the shared
 * page container. It renders on the server and contains no animation, so
 * section content is always visible in the prerendered HTML.
 *
 * By convention the section is labelled by `${id}-title`, the id that
 * {@link SectionHeading} gives its `<h2>`. Pass `aria-label` or
 * `aria-labelledby` to override.
 *
 * @example
 * <SectionContainer id="about">
 *   <SectionHeading section="about" title="How I build" />
 *   ...
 * </SectionContainer>
 */

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Props for the {@link SectionContainer} component.
 */
export interface SectionContainerProps
  extends ComponentPropsWithoutRef<"section"> {
  /** Anchor id used by navigation (e.g. `"about"`). */
  id: string;
  /** Section content. */
  children: ReactNode;
  /** Draws the hairline divider above the section. Defaults to `true`. */
  divider?: boolean;
  /** Extra classes for the inner page container. */
  containerClassName?: string;
}

/**
 * Semantic section wrapper with consistent spacing and container.
 *
 * @param props - Section configuration, children and native attributes.
 * @returns The rendered section element.
 */
export function SectionContainer({
  id,
  children,
  divider = true,
  className,
  containerClassName,
  ...props
}: SectionContainerProps): React.ReactElement {
  const labelledBy =
    props["aria-label"] || props["aria-labelledby"] ? undefined : `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("py-section", divider && "border-t border-line", className)}
      {...props}
    >
      <div className={cn("container-page", containerClassName)}>{children}</div>
    </section>
  );
}
