/**
 * Share card, for X.
 *
 * The same card as `opengraph-image`, which X does not fall back to: it
 * reads `twitter:image` and nothing else. Kept as its own file rather than
 * a re-export because the convention is a file, and both are generated at
 * build time from the one `pipeline`, so they cannot drift.
 *
 * What a link to this site looks like in a message, a post or a preview —
 * for most people the first and often only thing they will see of it. So
 * it is not a logo on a colour: it is the system, drawn from the same
 * `pipeline` the Hero renders, in the same palette, with the same rule
 * that nothing is on the card unless the site can substantiate it.
 *
 * Generated at build time, so it costs a request to nobody.
 *
 * Satori renders this, not a browser: layout is flexbox only, and every
 * element with more than one child has to say `display: flex` itself.
 */

import { ImageResponse } from "next/og";
import { pipeline } from "@/lib/pipeline";
import { siteConfig } from "@/lib/constants";

export const alt =
  "Abdelrhman Ahmed — AI Engineer. The retrieval-augmented architecture behind the work: knowledge, embeddings, index, retrieval, context, generation, evaluation, service, application.";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The design tokens, repeated here because Satori has no stylesheet. */
const COLOR = {
  background: "#080a0f",
  surface: "#0b0f16",
  foreground: "#e8edf2",
  muted: "#8c98a5",
  faint: "#5e6975",
  accent: "#8fafc4",
  line: "rgba(232,237,242,0.10)",
  lineStrong: "rgba(232,237,242,0.20)",
} as const;

export default function Image() {
  const stages = pipeline.stages;
  const firstRequest = stages.findIndex((stage) => stage.phase === "request");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: COLOR.background,
          padding: "68px 60px",
        }}
      >
        {/* ── Identity ── */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 20,
              letterSpacing: 4,
              color: COLOR.muted,
              textTransform: "uppercase",
            }}
          >
            {`AI Engineer · ${"Alexandria, Egypt"}`}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 76,
              fontWeight: 600,
              letterSpacing: -2,
              color: COLOR.foreground,
            }}
          >
            {siteConfig.author.name}
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 27,
              lineHeight: 1.45,
              color: COLOR.muted,
              maxWidth: 900,
            }}
          >
            I build production LLM systems end to end — grounded retrieval,
            structured evaluation, and the services underneath.
          </div>
        </div>

        {/* ── The system ── */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 17,
              letterSpacing: 3,
              color: COLOR.accent,
              textTransform: "uppercase",
            }}
          >
            {pipeline.title}
          </div>

          <div style={{ display: "flex", marginTop: 26, alignItems: "flex-end" }}>
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  // The build half ends here and the request half begins —
                  // the same boundary the schematic draws as a dotted rule.
                  borderLeft:
                    index === firstRequest
                      ? `1px solid ${COLOR.lineStrong}`
                      : "1px solid transparent",
                  paddingLeft: 14,
                }}
              >
                <div style={{ fontSize: 15, color: COLOR.faint }}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    // Sized so the longest label — "Embeddings" — still fits
                    // its own ninth of the rail instead of running into the
                    // next stage's column.
                    fontSize: 17,
                    color: COLOR.foreground,
                  }}
                >
                  {stage.label}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    width: 13,
                    height: 13,
                    background: COLOR.background,
                    border: `1px solid ${
                      stage.phase === "request" ? COLOR.accent : COLOR.lineStrong
                    }`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* The rail the stages sit on. */}
          <div
            style={{
              marginTop: -7,
              height: 1,
              width: "100%",
              background: COLOR.lineStrong,
            }}
          />

          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 16,
              letterSpacing: 2,
              color: COLOR.faint,
              textTransform: "uppercase",
            }}
          >
            {siteConfig.url.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    size
  );
}
