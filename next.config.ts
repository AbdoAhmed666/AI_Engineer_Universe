import type { NextConfig } from "next";

/**
 * Two builds from one source.
 *
 * The default build is the one this project has always had: a server build
 * that `next start` can run, which is what `npm run dev` and `npm run build`
 * still produce. Setting `STATIC_EXPORT=1` produces the other one — a folder
 * of HTML, CSS and JS in `out/` with no server behind it, which is what
 * GitHub Pages serves.
 *
 * The export is viable at all only because the site never needs a server:
 * every route prerenders, there are no route handlers, no cookies, no
 * redirects and no server actions. The ask box is no exception — it
 * retrieves in the browser, so the one interactive thing on the page ships
 * as static files too. The single feature that has to give way is image
 * optimization, which needs a running Next.js to resize on demand — so in
 * the export the one image on the page is served as authored.
 *
 * Gated rather than always on, because `output: "export"` makes `next start`
 * an error, and breaking the local workflow to satisfy the deploy would be
 * the wrong way round.
 */
const isExport = process.env.STATIC_EXPORT === "1";

/**
 * Sub-path the site is served under, when it is not at a domain root.
 *
 * A GitHub Pages project site lives at `/<repo>/`, so every asset URL and
 * internal link has to carry that prefix or the page loads its HTML and
 * none of its JavaScript. Empty for a site served at the root.
 *
 * Set at build time rather than detected, because the export is a folder of
 * files that has no idea where it will be mounted.
 */
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  /*
   * `basePath` rewrites the framework's own asset URLs, but an unoptimized
   * `next/image` passes its `src` through untouched — so a file in
   * `public/` would be requested from the domain root and 404 under a
   * sub-path. Exposing the prefix lets the one such image prepend it.
   */
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(isExport
    ? {
        output: "export" as const,
        // No resizing server in a static host: `next/image` still handles
        // layout and lazy loading, it just stops rewriting the source.
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
