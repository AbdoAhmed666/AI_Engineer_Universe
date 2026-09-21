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
 * The export is viable at all only because the site never needed a server:
 * every route already prerenders, there are no route handlers, no cookies,
 * no redirects and no server actions. The single feature that has to give
 * way is image optimization, which needs a running Next.js to resize on
 * demand — so in the export the one image on the page is served as authored.
 *
 * Gated rather than always on, because `output: "export"` makes `next start`
 * an error, and breaking the local workflow to satisfy the deploy would be
 * the wrong way round.
 */
const isExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
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
