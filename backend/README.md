# CP Automation Backend

Backend API for the CP Automation public site and admin CMS.

## Core Scripts

```bash
bun run dev
bun run start
bun run check
bun run prisma:generate
bun run prisma:validate
bun run prisma:migrate:deploy
bun run db:apply-schema
bun run db:seed
bun run db:seed:all
bun run db:seed:foundation
bun run db:seed:catalog
bun run db:seed:content
bun run db:verify:seed
bun run db:verify:scopes
bun run db:verify:migration
bun run smoke:api
bun run admin:create -- <username> <email> <password> [role]
```

## Fresh Local Database

For a brand-new local database in this repo, bootstrap the legacy baseline first and then apply Prisma migrations:

```bash
bun run db:apply-schema
bun run prisma:migrate:deploy
bun run db:seed
```

`bun run prisma:migrate:dev` is not the right first step here because the current Prisma migration chain starts from the legacy SQL schema and expects tables like `projects`, `products`, and `services` to already exist.

## Scoped Seed Commands

```bash
bun run db:seed:admin
bun run db:seed:media
bun run db:seed:site-settings
bun run db:seed:home-page
bun run db:seed:about-page
bun run db:seed:products
bun run db:seed:services
bun run db:seed:projects
bun run db:seed:testimonials
bun run db:seed:page-sections
bun run db:seed:content-sections
```

## Environment Templates

- Local baseline: `backend/.env.example`
- Staging template: `backend/.env.staging.example`
- Production template: `backend/.env.production.example`

Do not commit real secrets. Fill the correct template on the branch or environment where you deploy.
If you run `.github/workflows/staging-backend-verification.yml`, also create GitHub Actions staging secrets for `STAGING_DATABASE_URL`, `STAGING_ADMIN_USERNAME`, `STAGING_ADMIN_EMAIL`, `STAGING_ADMIN_PASSWORD`, and `STAGING_API_BASE_URL`.

## Required External Setup

Before this backend can work end-to-end in a real environment, you still need to provide:

- A Postgres database and a working `DATABASE_URL`
- A Cloudinary account for `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`
- A password reset delivery target:
  - recommended: Brevo transactional email with `BREVO_API_KEY` and `BREVO_SENDER_EMAIL`
  - alternative: a custom `PASSWORD_RESET_WEBHOOK_URL`
- Frontend and admin URLs for `CORS_ORIGIN` and `ADMIN_APP_URL`
- Review the committed admin seed in `backend/prisma/seed-data/admin.ts` and change it before using a shared environment

If neither Brevo nor `PASSWORD_RESET_WEBHOOK_URL` is configured, forgot-password requests only log the reset URL instead of sending email.
The admin account itself is stored in the database after seeding, and the seed source now lives in `backend/prisma/seed-data/admin.ts`.

## Auth And Recovery Endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/password-policy`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`

## Seed Structure

Starter content is now split by domain under:

- `backend/prisma/seed-data/`
- `backend/prisma/seeds/`

`backend/prisma/seed.ts` remains the single entrypoint for `prisma db seed`, but it now supports targeted scopes via `--scope`.

## Deployment Docs

- Launch order: `docs/launch-runbook.md`
- Full Vercel + Render deployment guide: `docs/deployment-vercel-render.md`
- Content approvals and launch prerequisites: `docs/content-handover-checklist.md`
- Discovery and content inventory: `docs/phase-0-discovery.md`
