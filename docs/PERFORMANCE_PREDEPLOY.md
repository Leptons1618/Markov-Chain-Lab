# Pre-deployment performance, reliability, and security plan

This checklist captures concrete improvements to apply before production. It’s tailored to this repo (Next.js 15 App Router, React 19, pnpm, Tailwind v4) and Vercel hosting.

## Objectives

- Reduce TTFB and LCP with selective prerendering, caching, and asset optimization
- Cut bundle size and JS execution on client
- Improve resilience, observability, and security

## High-impact changes (do these first)

1) Replace local file writes with a database or feature-flag them off
- Current admin APIs write to `data/lms.json` which isn’t durable on Vercel.
- Minimal path: disable mutation endpoints in production behind an env flag.
- Preferred: add a DB (e.g., Postgres/Supabase) and migrate read/write paths.

2) Image optimization
- In `next.config.mjs`, `images.unoptimized: true` disables Next’s image pipeline. For production, remove this or scope remote patterns explicitly.

\`\`\`js
// next.config.mjs (production-ready)
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Remove `unoptimized` in prod; configure allowed domains if you use remote images
    remotePatterns: [
      // { protocol: 'https', hostname: 'your-cdn.example.com' }
    ],
  },
};
export default nextConfig;
\`\`\`

3) Don’t ignore type and lint errors in prod builds
- `ignoreDuringBuilds` and `ignoreBuildErrors` hide real problems.
- Remove these tolerances and run lint/typecheck in CI (fail on error).

\`\`\`js
// next.config.mjs: remove these in production
eslint: { /* ignoreDuringBuilds: true */ },
typescript: { /* ignoreBuildErrors: true */ },
\`\`\`

4) Prefer Static Generation and ISR where possible
- App Router: default to static/ISR for pages that don’t need per-request data.
- For dynamic segments like `app/admin/courses/[courseId]`, generate params if content is known ahead of time.

\`\`\`ts
// app/examples/[id]/page.tsx (example)
export const revalidate = 60; // ISR every 60s (tune per freshness)

export async function generateStaticParams() {
  // return [{ id: 'weather' }, { id: 'queueing' }];
}
\`\`\`

- If a route must always be dynamic, mark it explicitly to avoid partial prerender surprises:

\`\`\`ts
export const dynamic = 'force-dynamic';
\`\`\`

5) Dynamic imports for heavy client components
- Charts (Recharts), large editors, or admin tools should load on demand.

\`\`\`tsx
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false });
\`\`\`

6) Cache control for route handlers
- For GET APIs that are pure and cacheable, add `Cache-Control` headers.

\`\`\`ts
// app/api/examples/route.ts
export async function GET() {
  const data = /* fetch or compute */ [];
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
\`\`\`

7) Bundle analysis and trimming
- Add `next-bundle-analyzer` to identify heavy modules; replace or split where needed.
- Remove unused dependencies from `package.json`.

\`\`\`bash
# optional, dev-only
pnpm add -D @next/bundle-analyzer
\`\`\`

\`\`\`js
// next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer';
export default bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })({});
\`\`\`

## Additional improvements

- Fonts
  - Use `next/font` for built-in font optimization and zero render-blocking CSS for fonts.
- CSS
  - Tailwind v4 is already good; keep global CSS small, prefer component styles.
- Error boundaries and logging
  - Add `error.tsx` and `not-found.tsx` per route segments.
  - Log server errors to Vercel Analytics or Sentry.
- Security headers (via middleware)
  - Add a strict Content Security Policy (CSP), `X-Frame-Options`, `Referrer-Policy`, HSTS.

\`\`\`ts
// middleware.ts (example)
import { NextResponse } from 'next/server';
export function middleware(req: Request) {
  const res = NextResponse.next();
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  // Consider a CSP tailored to your asset domains
  return res;
}
\`\`\`

- SEO and sitemaps
  - Add `sitemap.xml`, `robots.txt`, and per-page metadata using App Router metadata APIs.
- Accessibility and i18n
  - Run an a11y audit; ensure UI components expose correct roles/labels.

## Vercel-specific performance and ops

- Edge Network
  - Vercel automatically provides global CDN and edge caching for static assets (`_next/static`, images, fonts).
  - Static pages are automatically cached at the edge.
- Serverless Functions
  - API routes run as serverless functions with automatic scaling.
  - Configure function regions for optimal latency.
- Compression
  - Vercel automatically serves gzip and Brotli compression.
- Observability
  - Use Vercel Analytics for performance monitoring.
  - Integrate with logging services (e.g., Sentry) for error tracking.
  - Add distributed tracing IDs to logs.

## CI/CD hardening (GitHub Actions)

- Add a "verify" workflow that runs on PRs:
  - `pnpm install --frozen-lockfile`
  - `pnpm lint` (fail on error)
  - `tsc -p tsconfig.json --noEmit` (typecheck)
  - `pnpm build`
- Protect `main` with required status checks.

## Minimal PRs you can create now

- PR 1: Remove `images.unoptimized`, add remotePatterns if needed.
- PR 2: Remove `ignoreDuringBuilds` and `ignoreBuildErrors`; add CI verify workflow.
- PR 3: Dynamic import Recharts and other heavy client-only widgets.
- PR 4: Add `revalidate` and `generateStaticParams` where routes are content-driven.
- PR 5: Add `middleware.ts` with security headers.
- PR 6: Gate admin write APIs behind an env flag or migrate to DB.

## Final pre-flight checklist

- [ ] No local file writes in production
- [ ] Images optimized (or behind a CDN)
- [ ] Typecheck and lint pass in CI
- [ ] Static/ISR routes marked; dynamic routes intentional
- [ ] Heavy components are dynamically imported
- [ ] Security headers set; no mixed content; CSP validated
- [ ] Observability configured (Vercel Analytics/Sentry)
- [ ] Rollback plan tested (Vercel deployment rollback)
