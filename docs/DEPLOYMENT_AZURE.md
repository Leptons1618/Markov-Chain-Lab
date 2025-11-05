# Production deployment to Azure with CI/CD

This guide explains how to deploy this Next.js 15 (App Router) application to Microsoft Azure with an automated GitHub Actions pipeline. It covers two production-ready options and recommends one for this repository.

- Option A (recommended): Azure App Service for Linux (Node 20) + GitHub Actions
- Option B: Azure Static Web Apps (Next.js SSR via Functions) + GitHub Actions

Notes specific to this repo:
- The app uses Next.js 15 and React 19 with server and client components under `app/` and API routes under `app/api/*`.
- Admin routes write to `data/lms.json` in development. App Service and Static Web Apps have ephemeral filesystems and/or multiple instances — do not rely on local file writes in production. Move to a database (see `docs/PERFORMANCE_PREDEPLOY.md`).
- Package manager: pnpm (lockfile present). Node 20 LTS is recommended.

## Prerequisites

- Azure subscription + a resource group (e.g., `rg-markov-prod`).
- GitHub repository (this repo) with branch protection for `main`.
- Optional: custom domain and TLS certificate (App Service/SWA both support managed certs).

## Option A: Azure App Service (recommended)

Best when you need full Next.js SSR, API routes, predictable Node runtime, scaling, slots, and easy rollbacks.

### 1) Provision the App Service

You can use Azure Portal or CLI. Portal steps:

1. Create App Service
   - Publish: Code
   - Runtime stack: Node 20 LTS
   - OS: Linux
   - Region: close to your users
   - SKU: `B1` for small test, `P1v3` for production baseline
2. Configure Application Settings (Configuration > Application settings)
   - `NODE_ENV=production`
   - `PORT=8080` (Next.js reads `PORT`; App Service listens on 8080)
   - Add your `NEXT_PUBLIC_*` and server-side secrets here (never commit secrets)
   - If you plan to build on the server (not recommended), set `SCM_DO_BUILD_DURING_DEPLOYMENT=true`
3. General settings
   - Node version: 20.x
   - Startup command: `npm run start -- -p 8080` (optional; Next respects `PORT`)
4. Logging / Monitoring
   - Enable Application Insights (create if missing)
   - Turn on container/application logs for troubleshooting
5. (Optional) Deployment slots
   - Create a `staging` slot for blue/green deploys and safe swaps

### 2) Configure CI/CD with GitHub Actions

You can authenticate with Azure in two common ways. OIDC (federated credentials) is recommended; publish profile is simpler but uses a long-lived secret.

#### A. OIDC (recommended)

1. In Azure Portal: App Service > Deployment Center > GitHub Actions > Set up OIDC (or use Azure AD to create a Federated Credential for your repo and branch)
2. In GitHub: no secret needed; the workflow logs into Azure with OIDC.

`/.github/workflows/deploy-azure-webapp.yml` (pnpm, build in CI, deploy artifact):

\`\`\`yaml
name: Deploy – Azure App Service

on:
  push:
    branches: ["main"]
  workflow_dispatch: {}

permissions:
  id-token: write
  contents: read

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: production
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install deps
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      # Optional: prune dev deps to shrink deploy size
      - name: Prune dev deps
        run: pnpm prune --prod

      # Zip the app for deployment (includes .next and node_modules)
      - name: Archive app
        run: |
          zip -r app.zip . -x "**/.git**" "**/.github/**" "**/.vscode/**"

      - name: Azure login (OIDC)
        uses: azure/login@v2
        with:
          enable-AzPSSession: true

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: YOUR_APP_SERVICE_NAME
          package: app.zip
\`\`\`

Replace `YOUR_APP_SERVICE_NAME` with your App Service name. Add any needed env vars in App Service > Configuration.

#### B. Publish profile (simpler)

1. In Azure Portal: App Service > Get publish profile (Downloads an XML)
2. In GitHub: Add secret `AZURE_WEBAPP_PUBLISH_PROFILE` with the XML content

Use the same workflow as above, but replace the login step with:

\`\`\`yaml
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: YOUR_APP_SERVICE_NAME
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: app.zip
\`\`\`

### 3) Post-deploy

- Verify the app listens on `PORT` (8080) and health responds at `/`.
- Add custom domain + TLS (App Service > Custom domains).
- Set autoscale rules (App Service plan) and enable Always On.
- Configure staging slot, deploy there first, then swap to production.
- Monitor logs and Application Insights for performance and errors.

### 4) Known pitfalls

- Do not write to local files in production. Use a database or blob storage.
- Ensure `images` are optimized (see performance doc). Remove `images.unoptimized` in production.
- Keep Node at 20.x; Next.js 15 requires modern Node.
- If deploy size is large, prefer building in CI and pruning dev deps before deploy.

## Option B: Azure Static Web Apps (SWA)

SWA can host Next.js with SSR via Azure Functions and runs a GitHub Actions workflow. Choose SWA if your app is mostly static, and your API writes are stateless (no local file writes). This repo’s admin routes that write to disk will not work on SWA without rework.

### 1) Create SWA

- Portal: Create Static Web App (Standard plan recommended) and connect it to GitHub
- App location: `/`
- API location: auto (Functions created for SSR)

### 2) GitHub Actions (auto-generated)

Replace the build steps with pnpm if needed:

\`\`\`yaml
- uses: pnpm/action-setup@v4
  with:
    version: 9
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: pnpm
- run: pnpm install --frozen-lockfile
- run: pnpm build
\`\`\`

Set app/environment variables in SWA configuration (portal) or via SWA CLI.

### 3) Notes for SWA

- No durable local filesystem. Replace admin write endpoints with a database.
- Cold starts can affect SSR; consider pre-rendering and ISR.
- For heavy SSR, App Service often provides more predictable performance and scaling options.

## Environment variables

🔐 **Security Note:** See [`SECURITY.md`](SECURITY.md) for detailed admin authentication setup.

**Required for Admin Panel:**
- `ADMIN_PASSWORD` - Strong password for admin authentication (server-only, NO prefix)
  - Generate with: `openssl rand -base64 24`
  - Set in Azure Portal → Configuration → Application Settings (App Service) or Settings → Configuration (SWA)
  - **NEVER** hardcode or commit this password

**Optional:**
- `NEXTAUTH_SECRET` - If using NextAuth.js for session management (server-only)
- `ADMIN_ALLOWED_IPS` - Comma-separated IP whitelist for extra security (server-only)

**General Rules:**
- Client-exposed: prefix with `NEXT_PUBLIC_` (available in browser and server)
- Server-only: no prefix; define in App Service/SWA settings (not committed)
- Never commit `.env.production` or `.env.local` to the repo.

## Rollbacks

- App Service: redeploy a previous workflow run artifact, or swap from staging slot
- SWA: re-run a previous workflow on the target commit

## Extras (optional but recommended)

- Azure Front Door or Azure CDN in front of App Service/SWA for global caching of static assets
- Key Vault for secret management (with system-assigned managed identity)
- Sentry or Application Insights for tracing and error monitoring

---

For performance and production hardening tasks to complete before going live, see `docs/PERFORMANCE_PREDEPLOY.md`.
