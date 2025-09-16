# Copilot Instructions for Markov Learning Lab

Use these repo-specific rules to act like a productive pair programmer in this Next.js 15 + React 19 App Router project.

## Architecture & Data Flow
- App is purely client-side today (no API routes/server actions). Pages live under `app/*` with dynamic segments like `app/learn/[module]` and `app/examples/[id]`.
- State is local to pages/components; no global store. Content is currently hard-coded in the pages (arrays/objects) and should be kept typed when you refactor.
- UI system: Tailwind CSS v4 (via `@tailwindcss/postcss`), shadcn-style primitives in `components/ui/*`, and a simple `cn()` util in `lib/utils.ts`.
- Theming is wired with `next-themes` via `components/theme-provider.tsx` and used in `app/layout.tsx`.
- Charts use Recharts inside client components. Tools page renders an interactive graph (SVG) and builds a transition matrix in-memory.

## Key Files & Patterns
- Routing examples:
  - `app/learn/page.tsx` lists modules and links to `"/learn/[module]?lesson=..."` (query param pattern).
  - `app/learn/[module]/page.tsx` renders lesson content from `lessonContent` keyed by `params.module` and guides next/prev using `lessonOrder`.
  - `app/examples/[id]/page.tsx` ignores `params.id` for now and shows a default weather case. If you add more, branch on `params.id`.
  - `app/tools/page.tsx` maintains a `MarkovChain` shape: `{ states: {id,name,x,y,color}[]; transitions: {id,from,to,probability}[] }` and derives a transition matrix.
- UI primitives are imported from `@/components/ui/*` and accept Tailwind className overrides; keep variants consistent with existing components.
- Type helpers: use `cn()` from `lib/utils.ts` for class merging.
- Dynamic segments are client components (`"use client"`). Prefer keeping heavy logic in small helpers to reduce component size.

## Conventions & Gotchas
- TS config uses path alias `@/*`. Keep imports absolute from the repo root.
- Strict TS is on, but Next config ignores type and eslint errors during builds. Don’t rely on that; keep types correct and avoid `any`.
- Tailwind v4 is configured via PostCSS. Global styles live in `app/globals.css` and `styles/globals.css` (legacy). Prefer `app/globals.css`.
- Images are `unoptimized: true`. Don’t introduce remote images that depend on Next Image features without updating config.
- Use KaTeX-style formulas inside strings/JSX as in lessons; if adding MDX later, keep the same math semantics.

## Dev Workflows
- Install and run:
  - Install: `pnpm install`
  - Dev: `pnpm dev` → http://localhost:3000
  - Build/Start: `pnpm build && pnpm start`
  - Lint: `pnpm lint` (rules are minimal today)
- Client-only repo: avoid adding server-only modules unless you also add API routes and handle env separation.
- When adding new pages under `app/`, prefer App Router patterns: nested routes, `loading.tsx` for suspense, and `layout.tsx` if a section needs different chrome.

## Feature-Specific Notes
- Lessons: content is embedded in `app/learn/[module]/page.tsx` (objects with `text | definition | formula | interactive`). When you add lessons, follow that shape and update `lessonOrder`.
- Tools (Chain Builder): keep probability values in [0,1]; simulation samples outgoing edges by cumulative prob; reverse edges render with curved paths; self-loops have a special arc. If you add validation, normalize each row and surface warnings in the Analyze tab.
- Examples: add additional case studies by branching on `params.id` and providing sections (problem, model, analysis). Consider reusing the weather simulation helpers.

## How to Extend Safely
- Small refactors first: extract data from pages into typed modules (e.g., `content/lessons.ts`, `content/examples.ts`) without changing UI.
- If you introduce persistence, start with localStorage in page components. Only later add API routes and DB; keep client/server boundaries clear.
- Reuse existing components before adding new UI primitives. If a new primitive is needed, place it under `components/ui/` with props/variants mirroring existing ones.

## Examples
- Link to a lesson: `<Link href={`/learn/${moduleId}?lesson=${lessonId}`}>` using existing pattern from `app/learn/page.tsx`.
- Generate a transition matrix: see `generateTransitionMatrix()` in `app/tools/page.tsx` and keep the state index order consistent with `chain.states`.

## References
- Read `docs/ARCHITECTURE.md`, `docs/FEATURES.md`, and `docs/ROADMAP.md` for intent and near-term plan.
- Code style, tokens, and theming are exemplified across `components/ui/*` and `app/layout.tsx`.
