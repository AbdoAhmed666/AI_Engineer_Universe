# AI Engineer Universe

The portfolio of [Abdelrhman Ahmed](https://github.com/AbdoAhmed666), an AI
engineer in Alexandria, Egypt.

**[abdoahmed666.github.io/my-portfolio](https://abdoahmed666.github.io/my-portfolio/)**

![The retrieval-augmented architecture the site is built around](https://abdoahmed666.github.io/my-portfolio/opengraph-image.png)

---

## The one idea

Most portfolios *describe* systems. This one *is* one.

A single rule runs through every drawing on the page:

> **If it cannot be traced to real project data, it is not drawn.**

That is not a slogan — it is enforceable by reading the source. Every module in
[`src/lib/architecture.ts`](src/lib/architecture.ts) carries the exact line in
[`src/sections/Projects.tsx`](src/sections/Projects.tsx) it was derived from. A
building is tall because its project documents that many layers. A floor is wide
because that layer has that many parts. A window is lit because it stands for a
documented module, and dark when it stands for nothing.

No project is scored against another, and nothing is drawn for decoration.

## What derives from what

```
Projects.tsx                the claims, each one a line you can check
   │
   ├── pipeline.ts          nine stages, each naming the projects behind it
   │      ├── SystemSchematic       inline SVG — always present, no JavaScript needed
   │      └── SignalPathScene       the same nine stages in 3D
   │
   └── architecture.ts      layers, modules, and the pipeline stages each implements
          └── CityScene     one building per project, standing on that same pipeline
```

Both directions of the bridge are visible. Inspect a pipeline stage in the hero
and it names the projects behind it; inspect a building in the city and it names
the stages it implements. Both read the same two files.

## Ask it something

The `/ask` section is the same rule applied to text: a question is matched
against what the site already claims, and what comes back is those claims,
each linked to where it is made. There is no language model, which is the
design rather than a compromise — a model would write a nicer paragraph and
would also be the only thing on this page able to say something the data
does not support.

The corpus is generated from `projects.ts`, `pipeline.ts` and
`architecture.ts` — the same three files the diagram and the city are drawn
from. Nothing is written for it to say. Fifty short documents, so retrieval
is BM25: lexical, deterministic, and small enough to run in the visitor's
browser. No endpoint, no key, no cost, nothing to rate limit, and it works
on a static host. The retriever is loaded on first use, so a visitor who
never asks anything pays nothing for it.

That is a measurement rather than a preference. `npm run eval:retrieval`
scores it against questions a visitor plausibly types, and the command
fails on a miss:

```
English   hit@1 20/20   hit@3 20/20
Arabic    hit@1 18/19   hit@3 19/19
```

Each result highlights the terms it was matched on, which is also where the
Arabic handling becomes visible: the question said "دوكر" and the match
happened on "docker".

Arabic is handled at the query, not in the index. The corpus stays English —
translating it would mean two sets of claims that can drift — so Arabic words
are folded to one spelling and mapped onto corpus vocabulary by an alias
table. A word missing from that table is a gap in the table, not an absence
in the corpus, and the box says which one it hit.

## Engineering constraints

These were treated as design constraints, not afterthoughts.

| | |
|---|---|
| **Initial JavaScript** | ~251 KB gzipped. Neither of the two heavy things is in it: `three` (230 KB gz) is fetched only when a device can actually use the 3D, and the corpus, the retriever and the Arabic table (6.4 KB gz) only when someone actually asks something. |
| **The 3D is never required** | The SVG schematic carries every stage and every technology, is server-rendered, and works with no JavaScript. The canvas mounts over it only when the viewport is wide enough, WebGL2 exists, there are cores to spare, the connection is not in data-saver mode, and motion is allowed. Any failure — including a lost GL context — leaves the schematic exactly as it was. |
| **Accessibility** | A screen-reader list carries all nine stages in full; the 3D never becomes the only source of anything. Stages and buildings are keyboard-operable, and the world is a real modal dialog: focus is trapped, the page behind is `inert`, and focus returns on close. |
| **One continuous animation** | The travelling signal, and nothing else. It runs the request half of the pipeline only — the build half is indexed once, and the label above it says so. It stops when the band is off screen or the tab is in the background, and is never declared at all under `prefers-reduced-motion`. |
| **Render budget** | No lights, no shadows, no textures, no post-processing. Flat materials, instanced geometry, merged edges, and a frame loop that only runs while something is actually moving. |

## Built with

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 ·
Three.js via react-three-fiber · Framer Motion

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

The 3D scene needs a viewport of 1024px or wider, WebGL2, and system animations
enabled. Below that you get the schematic — which is the point.

```bash
npm run eval:retrieval    # scores retrieval; no key, no network, no server
```

The ask box needs no configuration at all — it is part of the static build.

## Deployment

Published to GitHub Pages by a workflow in
[`my-portfolio`](https://github.com/AbdoAhmed666/my-portfolio), which builds
this repository with `BASE_PATH=/my-portfolio`. The source is not duplicated
there.

---

📧 abdoibrahim122000@gmail.com · 💼 [LinkedIn](https://www.linkedin.com/in/abdelrhman-ahmed-92a432260)
