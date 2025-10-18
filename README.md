# Markov Learning Lab

Interactive Markov chains learning platform built with Next.js App Router and a modern UI. This repo currently contains a working UI prototype with several interactive pages (Learn, Tools, Examples, Practice, Resources) and placeholder/sample data. This document summarizes the architecture, current feature status, gaps to production, and a concrete roadmap to make it production-ready.

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript, Tailwind CSS v4
- Radix UI + custom UI primitives (shadcn-inspired)
- Recharts (visualizations)

## Project structure

Key directories/files:

- `app/` – App Router pages and layouts
	- `/` Home landing
	- `/learn` Modules listing and progress UI
	- `/learn/[module]` Lesson runner (interactive content prototype)
	- `/examples` Catalog of classic/modern examples (with simple demos)
	- `/examples/[id]` Case study page (weather demo)
	- `/practice` Quiz engine with MCQ/TF/Numerical
	- `/resources` Library, reference formulas, and community links
	- `/tools` Chain Builder canvas (drag-Add states, transitions, simulate)
- `components/` – UI primitives and theme provider
- `lib/` – utilities (`cn`)
- `docs/` – architecture, features, gaps, roadmap, sources, and lesson outlines

See docs for deeper details:

- `docs/ARCHITECTURE.md`
- `docs/FEATURES.md`
- `docs/GAPS.md`
- `docs/ROADMAP.md`
- `docs/SOURCES.md`
- `docs/LESSON_OUTLINES.md`

## Sample and markup data inventory

The prototype uses in-file data structures for content and demos:

- `app/learn/page.tsx` – `learningModules` (modules, lessons, durations, completion flags)
- `app/learn/[module]/page.tsx` – `lessonOrder`, `lessonContent` (definitions, formulas, interactive coin flip)
- `app/examples/page.tsx` – `examples` (example cards incl. states/applications)
- `app/examples/[id]/page.tsx` – `caseStudyData` (weather case study + simulation)
- `app/practice/page.tsx` – `practiceQuestions` (quiz bank)
- `app/resources/page.tsx` – `resources` and `formulaReference` (library items and quick formulas)

These should eventually be moved to typed data modules or a CMS; see ROADMAP.

## Current status at a glance

High-level summary (details in `docs/FEATURES.md`):

- Core pages exist and render: Home, Learn, Lesson, Examples, Case Study, Practice, Resources, Tools
- Interactive demos: coin flip convergence chart (Recharts), simple random-step examples, chain builder canvas with basic simulation
- Styling and components are in place; fonts set; light theme baseline

Key gaps (full list in `docs/GAPS.md`):

- No persistent storage (user progress, quizzes, saved chains)
- No authentication or user profiles
- Chain Builder lacks validation/normalization, import/export, and analysis tools (n-step, stationary dist., hitting times)
- Lessons are hard-coded; no markdown/MDX pipeline; no citation rendering
- Incomplete routes: `app/learn/[module]/[lesson]` folder exists but no page; query param links are stubbed
- Theming provider exists but not wired; unused dependencies
- SEO metadata per-page missing; no sitemap/robots; no analytics
- No tests/CI; no error boundaries; accessibility and i18n not audited

## How to run locally

Prereqs: Node 18+ recommended.

\`\`\`pwsh
pnpm install
pnpm dev
\`\`\`

Then open http://localhost:3000.

## Production plan (overview)

The detailed, step-by-step plan is in `docs/ROADMAP.md`. In brief:

1) Stabilize content model (typed lesson/exercise/example data modules)
2) Complete routing and lesson flow, add MDX pipeline for content + citations
3) Enhance Tools (validation, matrix ops, stationary dist., import/export)
4) Add persistence (localStorage first, then optional auth + DB)
5) Quality: tests, a11y, SEO, performance, error boundaries
6) Platform: CI/CD, env config, analytics, security headers

## Research sources and lesson integration

Curated sources are listed in `docs/SOURCES.md`, and each lesson outline references relevant material in `docs/LESSON_OUTLINES.md`. The Resources page also links to high-quality books, courses, and papers.

## License

TBD. Add an explicit LICENSE before open-sourcing.
