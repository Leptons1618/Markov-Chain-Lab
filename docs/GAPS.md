# Gaps and Inconsistencies

A comprehensive list of gaps that block production-readiness.

## Functional gaps

- Lesson routing: `/learn/[module]` uses `?lesson=` param in links, but no `/learn/[module]/[lesson]` route exists. Implement nested routing and MDX content.
- Content storage: All lessons, examples, questions, and resources are hard-coded in components. Move to typed data modules or a CMS/MDX content directory.
- Chain Builder validation: No enforcement of probability bounds or row-sum normalization; simulation may be biased if rows ≠ 1.
- Chain Builder analysis: Missing stationary distribution, eigen decomposition, n-step probabilities (P^n), absorbing chain analysis, expected hitting times.
- Import/Export: UI buttons exist but not implemented.
- Persistence: No local/user persistence for progress, practice results, or saved chains.
- Resources/examples params: `/examples/[id]` ignores `id` and always loads `weather`.

## UX gaps

- No dark mode toggle despite `ThemeProvider` present.
- A11y not audited (keyboard focus order, aria labels, color contrast, SVG labeling for lines/paths).
- Error boundaries and resilient loading states are minimal.

## Platform/Quality gaps

- No tests (unit/e2e) or linting configuration present; `next lint` configured but no rules in repo.
- No SEO: page-specific metadata, OpenGraph, sitemap, robots.txt.
- No analytics, logging, or monitoring.
- No security headers (`next.config.mjs` minimal), no rate limiting.
- No CI workflows; no deploy configuration documented.
- LICENSE missing; README previously empty.

## Dependency hygiene

- Some Radix packages pinned to `latest`; prefer pinning to exact or caret semver.
- Many Radix components are listed but not used yet; consider pruning or adding usage.

## Data accuracy & citations

- Lessons include formulas and definitions without inline citations or source attributions; add references and review notation consistency.
- Resources page contains placeholder links/domains; replace with specific URLs.
