# Architecture

This project is a client-forward educational web app built on Next.js 15 (App Router), React 19, and Tailwind CSS v4. It currently functions as a UI prototype with local, in-file data.

## High-level workflow

- Landing page funnels users to Learn, Examples, Practice, Resources, and Tools.
- Learn provides a guided curriculum (modules -> lessons) with an interactive lesson runner.
- Examples showcases real-world use cases and small simulations.
- Practice offers quiz-style reinforcement with instant feedback.
- Resources aggregates external links and formula references.
- Tools contains a visual Chain Builder to model Markov chains and step through transitions.

## App Router structure

- `app/layout.tsx`: Root layout, font setup, global styles, and metadata.
- `app/page.tsx`: Home landing (marketing + quick preview of a simple chain).
- `app/learn/page.tsx`: Modules listing with sidebar and progress UI.
- `app/learn/[module]/page.tsx`: Lesson runner; renders typed `lessonContent` with text/definition/formula/interactive blocks.
- `app/examples/page.tsx`: Examples catalog grouped by classic/modern.
- `app/examples/[id]/page.tsx`: Case study page (weather demo with simulation and steady-state estimate).
- `app/practice/page.tsx`: Quiz engine (MCQ/TF/Numerical) with scoring and feedback.
- `app/resources/page.tsx`: Library, math reference, and community sections.
- `app/tools/page.tsx`: Chain Builder canvas with state/transition editing and simple simulation.

## State and data flow

- Current implementation uses React local state in each page. No global store.
- Content is hard-coded within files (arrays/objects). No server components or external API calls.
- Charts use Recharts within client components.

## UI system

- Tailwind CSS v4 with custom design tokens (e.g., `bg-card`, `text-muted-foreground`).
- Radix + shadcn-style components under `components/ui` (Button, Card, Input, Label, Progress, RadioGroup, Tabs, Badge).
- `components/theme-provider.tsx` exists for next-themes but is not yet wired into `layout.tsx`.

## Tools (Chain Builder) internals

- Maintains `chain: { states: {id,name,x,y,color}[]; transitions: {id,from,to,probability}[] }` in component state.
- Canvas interaction: click to add node; click node -> click node to add directed edge; middle-click drag to pan; resizable sidebar.
- Simulation: chooses next state by sampling outgoing edges weighted by `probability`.
- Analysis: renders transition matrix table from `states x states`.
- Missing: row normalization, probability validation, saving/loading, stationary distribution, n-step probabilities, path statistics.

## Rendering modes

- All pages are client components using `"use client"` where necessary for interactivity.
- No API routes or server actions are present.

## Fonts and theming

- Google fonts (Inter, JetBrains Mono) loaded in layout.
- No `<ThemeProvider>` usage yet; dark mode tokens present but not controlled.

## Build and runtime

- Scripts: `dev`, `build`, `start`, `lint`.
- No env usage; no external services.

