/**
 * Page background.
 *
 * A static technical grid that frames the top of the page and fades out
 * radially. Pure CSS, rendered on the server, no animation, and hidden from
 * assistive technology.
 *
 * @example
 * import { Background } from "@/components/common";
 *
 * <body className="relative">
 *   <Background />
 *   <main>{children}</main>
 * </body>
 */

import { cn } from "@/lib/utils";

/**
 * Props for the {@link Background} component.
 */
export interface BackgroundProps {
  className?: string;
}

/**
 * Static grid background positioned behind the first viewport.
 *
 * @param props - Optional class name overrides.
 * @returns The rendered background element.
 */
export function Background({ className }: BackgroundProps): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[110vh]",
        "bg-grid mask-fade-radial opacity-60",
        className
      )}
    />
  );
}
