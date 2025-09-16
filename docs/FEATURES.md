# Feature Inventory and Status

This file enumerates current features by area and marks their status. Where features are partially implemented, we list next steps.

Legend: [Done] [Partial] [Planned]

## Core Navigation / Pages

- Home landing with marketing sections — [Done]
- Learn modules list with progress UI — [Partial]
  - Static modules and progress; no persistence — [Partial]
- Lesson runner (`/learn/[module]`) with mixed content types — [Partial]
  - Renders definitions, formulas, and an interactive coin flip (Recharts) — [Done]
  - Lesson sequencing next/prev across modules — [Done]
  - Per-lesson route (`/learn/[module]/[lesson]`) — [Planned]
  - MDX-based content and citations — [Planned]
- Examples catalog with tabs and selection — [Done]
- Case study page (`/examples/[id]`) — [Partial]
  - Weather case present; `[id]` param not used to branch content — [Partial]
- Practice (quiz engine with MCQ/TF/Numerical) — [Partial]
  - In-memory session, scoring, explanations — [Done]
  - Timer, modes (practice vs assessment) — [Done]
  - Result persistence / review — [Planned]
- Resources library and reference — [Done]

## Tools: Chain Builder

- Add state by click — [Done]
- Add transition by clicking source then target (self-loops supported) — [Done]
- Edit transition probability — [Done]
- Simple simulation (Start/Step/Reset) and current state indicator — [Done]
- Pan canvas (middle mouse), resizable sidebar — [Done]
- Transition matrix rendering — [Done]
- Validation (row sums to 1, probability bounds) — [Planned]
- Import/Export (.json) — [Planned]
- Calculations: n-step P^n, stationary distribution, absorbing analysis — [Planned]
- Save/Load chains (localStorage, then user account) — [Planned]

## UX, Theming, Accessibility

- Tailwind-based design with tokens — [Done]
- Dark mode with next-themes — [Planned]
- Keyboard navigation and a11y checks — [Planned]
- Error boundaries / loading states beyond provided pages — [Planned]

## Platform & Quality

- TypeScript types and basic utils — [Done]
- Unit tests, e2e tests — [Planned]
- ESLint / Prettier config — [Planned]
- SEO metadata per page, sitemap/robots — [Planned]
- Analytics (e.g., Vercel Analytics) — [Planned]
- Auth and profiles — [Planned]
- Persistence (DB or files) — [Planned]
- CI/CD (GitHub Actions + Vercel) — [Planned]

