# Prisma Phase 4 Seeding

Generated on 2026-04-03.

## Purpose

Phase 4 adds a deterministic Prisma seed for fresh environments so the project is immediately usable after migration.

This seed is designed for:

- local development
- staging
- fresh Neon branches
- demos and QA environments

For an existing legacy database, use the Phase 3 import script instead of the fresh seed.

## Seed Inputs

The seed reads the admin credentials from `backend/prisma/seed-data/admin.ts`.
These values are seed inputs only. The actual admin user is stored in the database, and login reads from the database record after seeding.

## What Gets Seeded

- `User`
  - one admin user with a hashed password
- `MediaAsset`
  - logo
  - home OG image
  - about portrait placeholder
  - starter project images
- `SiteSettings`
  - company identity
  - contact details
  - footer content
  - social placeholders
- `HomePage`
  - hero
  - trust points
  - section intros
  - custom solutions
  - contact CTA
- `AboutPage`
  - starter founder/admin profile content
  - mission
  - vision
  - values
  - stats
- `Product`
  - starter catalog entries
- `Service`
  - starter service entries
- `Project`
  - starter gallery projects
- `Testimonial`
  - starter social proof
- `PageSection`
  - navigation
  - trust highlights
  - contact methods
- `ContentSection`
  - compatibility records for the current legacy admin content editor

## Idempotency Strategy

The seed avoids blind inserts.

It uses:

- `upsert` on singleton IDs
- `upsert` on unique `slug` fields
- `upsert` on unique `publicId` for media assets
- `upsert` on the `pageType + sectionKey` compound key
- `upsert` on `sectionName` for legacy content sections
- deterministic fixed IDs for seeded testimonials

## Run Order

Fresh database flow:

1. Apply the Phase 3 migration SQL
2. Run `bun run db:seed`
3. Start the backend and verify the content loads

Legacy database upgrade flow:

1. Apply the Phase 3 migration SQL
2. Run `bun run db:import:legacy`
3. Run `bun run db:verify:migration`

## Notes

- The starter copy is intentionally more polished and modern than the current hardcoded website text.
- The about-page portrait is seeded as a placeholder media asset and should be replaced from the admin dashboard once real founder/admin media is available.
