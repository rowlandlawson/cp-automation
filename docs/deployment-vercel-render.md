# Vercel + Render Deployment Guide

This is the operational guide for deploying the CP Automation frontend to Vercel and the backend API to Render.

## Architecture

- Frontend: static site on Vercel
- Admin UI: static files under `/admin` on the same Vercel project
- Backend API: Bun + Express app on Render
- Database: Postgres reachable from Render and local tooling
- Media storage: Cloudinary for files, Prisma/Postgres for metadata only

## Files You Will Update Later

- Frontend Vercel env template: `.env.vercel.example`
- Backend local template: `backend/.env.example`
- Backend staging template: `backend/.env.staging.example`
- Backend production template: `backend/.env.production.example`
- Render blueprint: `render.yaml`
- Vercel routing/caching config: `vercel.json`

## Frontend Environment Values

The static frontend does not read `.env` directly in the browser. Instead:

1. Vercel exposes build-time environment variables.
2. `npm run build` runs `scripts/generate-runtime-config.mjs`.
3. That script writes `runtime-config.js`.
4. The public site and admin UI read:
   - `window.__CP_API_BASE_URL`
   - `window.__ADMIN_API_BASE_URL`

Set these values in Vercel:

- `CP_API_BASE_URL=https://your-render-backend.onrender.com/api`
- `ADMIN_API_BASE_URL=https://your-render-backend.onrender.com/api`
- `CP_APP_ENV=production`

If you change Vercel environment variables, redeploy so `runtime-config.js` is regenerated.

## Backend Environment Values

Set these values in Render or in `backend/.env` for local/staging work:

- `DATABASE_URL`
- `PORT`
- `CORS_ORIGIN`
- `ADMIN_APP_URL`
- `JWT_SECRET`
- `CLOUDINARY_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PASSWORD_RESET_TOKEN_TTL_MINUTES`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `BREVO_REPLY_TO_EMAIL`
- `BREVO_REPLY_TO_NAME`
- `PASSWORD_RESET_WEBHOOK_URL`
- `NODE_ENV`
- `SMOKE_API_BASE_URL` (optional)
- `SMOKE_ADMIN_USERNAME` (optional)
- `SMOKE_ADMIN_PASSWORD` (optional)

If you use the GitHub Actions staging backend verification workflow, also create these GitHub Actions secrets:

- `STAGING_DATABASE_URL` (or fallback `DATABASE_URL`)
- `STAGING_ADMIN_USERNAME`
- `STAGING_ADMIN_EMAIL`
- `STAGING_ADMIN_PASSWORD`
- `STAGING_API_BASE_URL`

Notes:

- `CORS_ORIGIN` must be the Vercel frontend origin.
- `ADMIN_APP_URL` must be the public admin URL, for example `https://your-site.vercel.app/admin`.
- Recommended password-reset setup: configure Brevo directly with a verified `BREVO_SENDER_EMAIL`.
- Optional alternative: set `PASSWORD_RESET_WEBHOOK_URL` if another service should send the email for you.
- Delivery order is `Brevo -> webhook -> log only`.
- If neither Brevo nor the webhook is configured, reset links fall back to backend logs instead of inbox delivery.
- The admin seed credentials now come from `backend/prisma/seed-data/admin.ts`; the real login account is stored in the database after seeding.

## External Accounts You Must Provide

This repo does not auto-create third-party accounts for you. Before launch, you still need:

- Postgres hosting for `DATABASE_URL`
- Cloudinary for media storage
- Brevo for transactional email, unless you are using your own reset webhook
- Render for the backend service
- Vercel for the static frontend and admin host

## Local Setup From Zero

1. Copy the backend template you want to use into `backend/.env`.
2. Install backend dependencies:
   - `cd backend`
   - `bun install`
3. Generate Prisma client:
   - `bun run prisma:generate`
4. Apply migrations:
   - fresh local dev database:
     - `bun run db:apply-schema`
     - `bun run prisma:migrate:deploy`
   - staging/production database: `bun run prisma:migrate:deploy`
5. Seed the database:
   - full seed: `bun run db:seed`
6. Verify seeded state:
   - `bun run db:verify:scopes`
   - `bun run db:verify:seed`
   - `bun run db:verify:migration`
7. Start the API:
   - `bun run start`
8. Run smoke coverage against the running API:
   - `bun run smoke:api`

## Scoped Seed Commands

These commands are available from `backend/`:

- `bun run db:seed`
- `bun run db:seed:all`
- `bun run db:seed:admin`
- `bun run db:seed:media`
- `bun run db:seed:site-settings`
- `bun run db:seed:home-page`
- `bun run db:seed:about-page`
- `bun run db:seed:products`
- `bun run db:seed:services`
- `bun run db:seed:projects`
- `bun run db:seed:testimonials`
- `bun run db:seed:page-sections`
- `bun run db:seed:content-sections`
- `bun run db:seed:foundation`
- `bun run db:seed:catalog`
- `bun run db:seed:content`

Dependency behavior:

- `media` automatically seeds `admin` first.
- `site-settings`, `home-page`, `about-page`, and `projects` automatically seed `admin` and `media` first.
- `content-sections` automatically seeds `admin` first.

## Clean Database Workflow

Use this order on a brand-new database:

1. `bun run prisma:generate`
2. `bun run db:apply-schema`
3. `bun run prisma:migrate:deploy`
4. `bun run db:seed`
5. `bun run db:verify:scopes`
6. `bun run db:verify:seed`
7. `bun run db:verify:migration`
8. `bun run smoke:api`

## Admin Authentication Flows

These admin routes and pages now exist:

- Login page: `/admin/login.html`
- Forgot password page: `/admin/forgot-password.html`
- Reset password page: `/admin/reset-password.html`
- Logged-in password settings page: `/admin/#account-settings`

Backend coverage includes:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`

## Render Deployment

The repo now includes `render.yaml` for the backend service.

### Option A: Use `render.yaml`

1. Push the branch that contains `render.yaml`.
2. In Render, create a Blueprint or import the repo.
3. Confirm the backend service uses:
   - `rootDir: backend`
   - `buildCommand: bun install --frozen-lockfile && bun run prisma:generate && bun run check`
   - `preDeployCommand: bun run prisma:migrate:deploy`
   - `startCommand: bun run start`
   - `healthCheckPath: /api/health`
4. Fill every `sync: false` variable with real secrets or real URLs.
5. Deploy staging first.
6. After the first successful staging deploy, run:
   - `bun run db:seed`
   - `bun run db:verify:scopes`
   - `bun run db:verify:seed`
   - `bun run smoke:api`

### Option B: Configure Render Manually

Use the same values above if you prefer not to use the Blueprint file.

### Render Verification

After deploy, verify:

- `GET /api/health` returns `200`
- logs show the request ID middleware and structured request logs
- image uploads succeed
- Prisma migrations completed before startup
- smoke suite passes against the public Render URL

## Vercel Deployment

The repo now includes:

- `package.json` with `npm run build`
- `scripts/generate-runtime-config.mjs`
- `runtime-config.js`
- `vercel.json`

### Deploy Steps

1. Import the repo into Vercel.
2. Keep the project rooted at the repository root.
3. Ensure the build command is `npm run build`.
4. Ensure the output directory is `.`.
5. Add Vercel environment variables from `.env.vercel.example`.
6. Deploy preview first, then production.

### Vercel Verification

After deploy, verify:

- `/runtime-config.js` contains the expected Render API base URL
- homepage content loads from the API instead of falling back
- `/admin/login.html` signs in against the Render backend
- `/admin/forgot-password.html` reaches the forgot-password endpoint
- `/admin/reset-password.html` accepts a valid token

## Quality And Launch Commands

Backend checks:

- `bun run check`
- `bun run db:verify:seed`
- `bun run db:verify:migration`
- `bun run smoke:api`

Frontend/runtime checks:

- `node scripts/generate-runtime-config.mjs`
- `node --check assets/js/public-utils.js`
- `node --check admin/js/auth.js`
- `node --check admin/js/api.js`
- `node --check admin/js/password-recovery.js`
- `node --check admin/js/pages/account-settings.js`

Quality audits:

- `pwsh -File scripts/run-quality-audits.ps1 -SiteUrl https://your-frontend-url`

## Image Optimization And Caching Rules

Image handling already enforces:

- upload buffer optimization with Sharp
- automatic WebP conversion before upload
- width limiting for uploads
- Cloudinary `quality=auto`
- Cloudinary `fetch_format=auto`

Caching is configured in:

- backend middleware: `backend/middleware/cache-control.ts`
- static host fallback headers: `_headers`
- Vercel headers: `vercel.json`

## Staging Before Production

Use separate staging values for:

- database
- Render service URL
- Vercel preview or staging URL
- Cloudinary folder strategy if needed
- admin credentials
- password reset delivery target (Brevo sender or webhook)

Do not promote to production until staging passes:

- login and auth guard tests
- CRUD and publishing tests
- uploads and image replacement tests
- password reset and password change tests
- Lighthouse and accessibility checks

## Rollback Plan

1. Take a database backup before running production migrations.
2. Keep the current live branch and raw `pg` implementation available until verification is complete.
3. If the deployment fails:
   - roll back the Render service to the previous deploy
   - roll back the Vercel deployment alias
   - restore the database snapshot if the schema or content state is corrupted
4. Re-run smoke tests after rollback.

## Useful References

- Prisma Bun runtime guide: https://www.prisma.io/docs/guides/runtimes/bun
- Prisma seeding workflow: https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding
- Vercel project configuration: https://vercel.com/docs/configuration/
- Vercel environment variables: https://vercel.com/docs/projects/environment-variables
- Render blueprint spec: https://render.com/docs/blueprint-spec
- Render web services: https://render.com/docs/web-services
- Render environment variables: https://render.com/docs/configure-environment-variables
