# Launch Runbook

This runbook is the production order of operations for a fresh environment.

## Preconditions

- Staging must be deployed and verified before production.
- `backend/.env` must use real values for:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `CLOUDINARY_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `ADMIN_APP_URL`
- Configure password reset delivery before launch:
  - recommended: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME`
  - alternative: `PASSWORD_RESET_WEBHOOK_URL`
- Review and replace the committed admin seed credentials in `backend/prisma/seed-data/admin.ts` before seeding production.
- Confirm the public frontend URL is listed in `CORS_ORIGIN`.
- Confirm Vercel build-time values are set:
  - `CP_API_BASE_URL`
  - `ADMIN_API_BASE_URL`
  - `CP_APP_ENV`

## Deploy Order

1. Backup the target database.
2. Generate Prisma client:
   - `bun run prisma:generate`
3. Apply production migrations:
   - fresh empty database:
     - `bun run db:apply-schema`
     - `bun run prisma:migrate:deploy`
   - existing database with the legacy baseline already present:
     - `bun run prisma:migrate:deploy`
4. Seed the fresh environment:
   - `bun run db:seed`
   - Or use scoped commands if you are reseeding only one layer:
     - `bun run db:seed:foundation`
     - `bun run db:seed:catalog`
     - `bun run db:seed:content`
5. Verify the seeded database state:
   - `bun run db:verify:scopes`
   - `bun run db:verify:seed`
   - `bun run db:verify:migration`
6. Start the API and verify health:
   - `bun run start`
   - Check `GET /api/health`
7. Run the API smoke suite against the running backend:
   - `bun run smoke:api`
8. Upload or replace default media that should not stay on placeholders:
   - company logo
   - homepage hero visual
   - founder/admin portrait
   - default OG image
9. Re-run smoke checks after media replacement:
   - `bun run smoke:api`
10. Build the frontend runtime config and deploy the static site:

- `npm run build`
- Deploy to Vercel with the repo-root `vercel.json`

11. Run quality audits against the deployed frontend:

- Run `scripts/run-quality-audits.ps1 -SiteUrl http://127.0.0.1:4173`

12. Review launch blockers:

- Lighthouse mobile and desktop thresholds pass
- auth guards return `401` without tokens
- seeded singleton content is present
- CRUD flows succeed
- uploads and image replacement succeed
- public unpublished content stays hidden
- forgot-password and change-password flows succeed

13. Point traffic to production and launch.

## Smoke Coverage

`bun run smoke:api` covers:

- health endpoint
- login and `/auth/me`
- forgot-password, reset-password validation, and change-password guard coverage
- auth guards on protected admin routes
- CRUD for products, services, testimonials, content sections, and page sections
- public publishing behavior for products, testimonials, and page sections
- media upload, metadata update, and delete
- project image upload and image replacement cleanup
- orphaned media cleanup after replacement and delete

## Quality Audit Notes

`scripts/run-quality-audits.ps1` runs Lighthouse in:

- mobile mode
- desktop mode

The script records:

- performance
- accessibility
- best practices
- SEO
- LCP
- CLS
- TBT
- Speed Index

Reports are written to `artifacts/lighthouse/`.

## Cache and Logging Notes

- Backend API cache rules are applied in `backend/middleware/cache-control.ts`.
- Uploaded assets served by the backend now emit cache headers and `X-Content-Type-Options`.
- Static hosting cache rules for the public site are captured in the repo-root `_headers` file.
- Vercel production cache and rewrite rules are captured in `vercel.json`.
- Structured request, error, and process logging now flows through `backend/utils/logger.ts`.

## Related Docs

- `docs/deployment-vercel-render.md`
- `docs/content-handover-checklist.md`
