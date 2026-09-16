/**
 * Barrel exports for the layout components module.
 *
 * Re-exports the site `Header`, `Footer`, and `ScrollProgress` components along with their prop types and the shared
 * `NavLink` type so they can be imported from a single entry point.
 *
 * @example
 * import { Header, Footer, ScrollProgress } from "@/components/layout";
 */

export { Header } from "./Header";
export type { HeaderProps, NavLink } from "./Header";

export { Footer } from "./Footer";
export type { FooterProps } from "./Footer";

export { ScrollProgress } from "./ScrollProgress";
export type { ScrollProgressProps } from "./ScrollProgress";
