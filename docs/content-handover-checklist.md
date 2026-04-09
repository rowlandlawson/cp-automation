# Content And Launch Checklist

This file captures the non-code inputs and launch safeguards that still need owner approval before production.

## What Is Already In Place

- Content inventory and hardcoded-section audit: `docs/phase-0-discovery.md`
- Prisma-backed CMS models for singleton pages, collections, media metadata, and reusable page sections
- Cloudinary file storage with Prisma metadata only
- Structured admin forms for site settings, homepage, About page, testimonials, projects, products, services, and reusable page sections
- Password recovery pages and account password-change flow in the admin UI

## Decisions To Lock Before Production

- Brand rewrite direction:
  - conservative corporate
  - premium tech
  - warm service-business
- Final founder/admin identity:
  - name
  - title
  - short bio
  - long bio
  - mission
  - vision
  - portrait/headshot
- Final contact layer:
  - phone
  - WhatsApp
  - email
  - address
  - social links
- Final product list, service list, and differentiators
- Approved testimonials and explicit reuse permission
- Approved project photos and alt text

## Content Model Notes

- Images are not stored in Postgres. Files are optimized, uploaded to Cloudinary, and only metadata is stored in Prisma.
- The admin CMS currently uses structured fields and controlled text areas.
- Raw HTML editing is not enabled.
- If you later want richer formatting, add limited Markdown on selected fields instead of raw HTML.

## SEO Inputs Still Required

- Final site-wide meta title and description
- Final homepage meta title, description, and OG image
- Final About-page meta title, description, and OG image
- Alt text review for logo, founder portrait, product imagery, and project imagery
- Final canonical site URL in site settings

## Staging And Rollback Rules

- Do not apply new Prisma migrations to production first.
- Create a staging database and a staging Render service first.
- Create a staging Vercel environment that points to the staging backend.
- Run migrations, seeds, smoke tests, and Lighthouse checks on staging before production.
- Capture a database backup before the production migration.
- Keep the current raw `pg` branch available until production verification is complete.

## Recommended Launch Sequence

1. Finalize Prisma schema and migration plan.
2. Seed and verify a clean staging database from zero.
3. Replace placeholder brand content and media in staging.
4. Run admin auth, CRUD, upload, publishing, accessibility, and Lighthouse checks.
5. Approve brand copy and SEO fields.
6. Repeat the same process in production with a fresh backup and rollback window.
