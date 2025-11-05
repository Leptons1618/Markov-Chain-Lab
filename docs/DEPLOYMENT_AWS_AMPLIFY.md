# Production deployment to AWS Amplify (Next.js 15 SSR)

This guide explains how to deploy this Next.js 15 App Router app to AWS Amplify Hosting with server-side rendering (SSR) and automatic CI/CD from GitHub.

Highlights for this repo:
- Next.js 15 + React 19 using App Router and `app/api/*` route handlers
- pnpm package manager
- Admin APIs currently write to `data/lms.json` (OK for local dev; not suitable for serverless hosting like Amplify) — replace with a database or feature-flag off in production.

## Prerequisites

- AWS account with permissions for Amplify Hosting and IAM
- GitHub repository (this repo) and branch (e.g., `main`)
- Node 20 (we pin via `.nvmrc`)

## Option A (recommended): Amplify Hosting (SSR) via GitHub

Amplify Hosting supports Next.js SSR/ISR, API routes, image optimization, and automatic deployments on push.

### 1) Prepare the repo

- Add `.nvmrc` with `20` to ensure Node 20 during build
- Add `amplify.yml` with pnpm build steps and caching
- Ensure env variables/secrets are not hard-coded; we will set them in Amplify

Example `amplify.yml` (added to repo root):

\`\`\`yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - corepack enable
        - node -v
        - pnpm -v || npm i -g pnpm@9
        - pnpm install --frozen-lockfile
    build:
      commands:
        - pnpm build
  artifacts:
    # For Next.js SSR, Amplify auto-detects Next and uses .next; leave as-is
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
\`\`\`

> Note: Amplify auto-detects Next.js projects and configures CloudFront + Lambda@Edge under the hood for SSR.

### 2) Connect Amplify to GitHub

- AWS Console → Amplify Hosting → New app → Host web app
- Choose GitHub and authorize access, select this repository and branch (e.g., `main`)
- Build settings: Amplify will detect `amplify.yml` — confirm it shows pnpm steps
- Environment variables: add your `NEXT_PUBLIC_*` and server-only vars
  - Example:
    - `NODE_ENV=production`
    - `NEXT_PUBLIC_...`
    - server-only secrets (no `NEXT_PUBLIC_` prefix)

### 3) First deploy

- Amplify will run the build and provision SSR infrastructure
- On success, you’ll get a preview URL like `https://main.<hash>.amplifyapp.com`
- Attach a custom domain if desired (Amplify provides managed certificates)

### 4) ISR, caching, and revalidation

- ISR works with App Router when you export `revalidate` per route. Amplify supports ISR under the hood.
- For pure APIs that can be cached, set `Cache-Control` headers in responses.

### 5) Environment considerations

- Do not write to local files in production (Amplify functions are ephemeral and multi-instance). Replace `data/lms.json` writes with a database (e.g., DynamoDB, RDS, or a hosted Postgres like Neon/Supabase). Alternatively, gate admin write endpoints off in production via an env flag.
- Images: Remove `images.unoptimized: true` for production if you want optimized images; Amplify supports Next Image.
- Node version: keep to 20.x; `.nvmrc` helps Amplify choose the correct runtime.

### 6) CI/CD and rollbacks

- Every push to the connected branch triggers a build and deploy
- You can enable PR previews in Amplify for ephemeral environments
- Rollback: choose a previous successful build in Amplify’s console and redeploy

## Option B: Amplify Gen 2 (infrastructure-as-code)

If you prefer full IaC control, use Amplify Gen 2 (TypeScript-based) to define hosting, domains, and backend in code. This is more advanced and outside the scope of quick hosting, but it’s a good path if you plan to add auth, data, and other Amplify categories.

## Environment variables

🔐 **Security Note:** See [`SECURITY.md`](SECURITY.md) for detailed admin authentication setup.

**Required for Admin Panel:**
- `ADMIN_PASSWORD` - Strong password for admin authentication (server-only, NO prefix)
  - Generate with: `openssl rand -base64 24`
  - Set in Amplify console → App settings → Environment variables
  - **NEVER** hardcode or commit this password

**Optional:**
- `NEXTAUTH_SECRET` - If using NextAuth.js for session management (server-only)
- `ADMIN_ALLOWED_IPS` - Comma-separated IP whitelist for extra security (server-only)

**General Rules:**
- Client-exposed: prefix with `NEXT_PUBLIC_`
- Server-only: plain names (no prefix). Set in Amplify console → App settings → Environment variables
- Never commit `.env.production` or `.env.local` to the repo

## Custom domains

- Add domain in Amplify console, select branch, and attach a free managed certificate
- DNS can be Route 53 or your current registrar (CNAME records)

## Known pitfalls

- Local file writes (e.g., `data/lms.json`) won’t persist — use a DB
- If using large dependencies or heavy client bundles, consider dynamic imports and bundle trimming (see `docs/PERFORMANCE_PREDEPLOY.md`)
- Ensure `next.config.mjs` doesn’t ignore type/lint errors in production long term (clean this up as you harden CI)

## Minimal checklist before going live

- [ ] **🔐 SECURITY: Set up admin authentication** (see `SECURITY.md`)
  - [ ] Set `ADMIN_PASSWORD` environment variable in Amplify
  - [ ] Implement server-side auth API route
  - [ ] Remove hardcoded password from client code
  - [ ] Test login with production credentials
- [ ] Replace local file writes with a DB or disable admin writes in prod
- [ ] Remove `images.unoptimized` and configure remote image patterns if needed
- [ ] Add `revalidate` to static-friendly routes and dynamic import heavy client components
- [ ] CI verify workflow (lint/typecheck/build) in GitHub
- [ ] Observability with AWS (CloudWatch) or Sentry
