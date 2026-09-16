/**
 * Barrel exports for the layout components module.
 *
 * Re-exports the site `Header`, `Footer`, `LoadingScreen`, and
 * `ScrollProgress` components along with their prop types and the shared
 * `NavLink` type so they can be imported from a single entry point.
 *
 * @example
 * import { Header, Footer, LoadingScreen, ScrollProgress } from "@/components/layout";
 */

export { Header } from "./Header";
export type { HeaderProps, NavLink } from "./Header";

export { Footer } from "./Footer";
export type { FooterProps } from "./Footer";

export { LoadingScreen } from "./LoadingScreen";
export type { LoadingScreenProps } from "./LoadingScreen";

export { ScrollProgress } from "./ScrollProgress";
export type { ScrollProgressProps } from "./ScrollProgress";
