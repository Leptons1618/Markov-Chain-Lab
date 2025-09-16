# Production Readiness Roadmap

A pragmatic, step-by-step plan to evolve this prototype into a robust, production-ready learning platform.

## Phase 1 — Content & Routing (week 1)

- Define a typed content model for lessons, examples, questions, and resources (TypeScript modules under `content/`).
- Implement `/learn/[module]/[lesson]` route with MDX support (next-mdx-remote or Contentlayer).
- Port `lessonContent` into MDX files with frontmatter (title, module, duration, references).
- Render formulas with KaTeX/rehype-katex; add a `Formula` component.
- Upgrade Resources with verified links and add source attribution components.

Deliverables:
- `content/lessons/**/*.mdx`, `content/examples/**/*.json|mdx`, `content/questions.ts`, `content/resources.ts`
- `app/learn/[module]/[lesson]/page.tsx` + MDX renderer

## Phase 2 — Tools: Chain Builder math + IO (week 2)

- Add validation: enforce 0 ≤ p ≤ 1; normalize each row to sum to 1; warning indicators.
- Implement Import/Export (.json) and localStorage autosave.
- Add analysis utilities:
  - Build transition matrix from state ordering
  - Compute P^n (fast power), stationary distribution (solve πP=π with linear solver or power method)
  - Absorbing analysis (Q, R, N=(I−Q)⁻¹, absorption probabilities, expected steps)
- Add simple charts/tables for these metrics.

Deliverables:
- `lib/markov.ts` with matrix ops
- Updated Tools UI with validation badges, analysis tabs

## Phase 3 — Persistence & Accounts (weeks 3–4)

- Add Supabase or Prisma+Postgres for user accounts and saved artifacts (chains, progress, quiz results). Optional: start with localStorage only.
- Add API routes for CRUD on chains and progress.
- Implement auth UI (email + OAuth) and profile page.

Deliverables:
- `app/api/*` endpoints
- `app/profile` page
- Server-safe env config and secrets management

## Phase 4 — Quality, A11y, SEO, and DX (week 5)

- ESLint + Prettier config; strict TS settings; tsc in CI.
- Unit tests for utilities; Playwright/Cypress for critical flows.
- Add error boundaries and loading states; run axe checks for a11y.
- Per-page metadata, sitemap, robots, OpenGraph; add analytics.

Deliverables:
- `.github/workflows/ci.yml`
- `next-sitemap` or custom route for sitemap
- `middleware.ts` for security headers

## Phase 5 — Polish & Launch (week 6)

- Dark mode + theme toggle wired via `ThemeProvider`.
- Performance pass (avoid heavy client bundles; split code; image optimization).
- Final content review with citations; add LICENSE and CONTRIBUTING.

Milestone: Production deploy (Vercel), announce, and collect feedback.

