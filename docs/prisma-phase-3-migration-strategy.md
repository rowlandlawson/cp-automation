# Prisma Phase 3 Migration Strategy

Generated on 2026-04-03.

## Purpose

Phase 3 converts the redesigned Prisma schema into an executable migration package and a one-time import path for legacy content.

This phase intentionally separates:

- schema changes
- data import
- runtime refactor

That separation lowers risk and makes rollback easier.

## Deliverables

- Legacy schema snapshot: `backend/prisma/legacy-schema.prisma`
- Prisma migration SQL package: `backend/prisma/migrations/.../migration.sql`
- One-time importer: `backend/scripts/import-legacy-to-prisma.ts`
- Verification script: `backend/scripts/verify-prisma-migration.ts`

## Schema Freeze

During migration, do not edit `backend/prisma/schema.prisma` again until all of the following are true:

1. The generated migration SQL has been reviewed.
2. The migration has been applied to a staging or Neon branch database.
3. The legacy import script has run successfully.
4. The verification script passes.
5. The admin and public routes are updated against Prisma-backed data.

This prevents maintaining two moving schema contracts at once.

## Execution Order

1. Review the generated migration SQL.
2. Apply the migration to a disposable Neon branch or staging database.
3. Run the import script.
4. Run the verification script.
5. Smoke-test auth, products, services, projects, testimonials, and singleton content.
6. Only after the data shape is verified should the raw `pg` model layer be retired.

## Commands

From `backend/`:

```bash
bun run prisma:validate
bun run prisma:generate
bun run db:migrate:phase3
bun run db:import:legacy
bun run db:verify:migration
```

## Why The Runtime Is Not Switched Yet

The current backend still uses handwritten raw-`pg` models. That is intentional at this stage.

Until the migration SQL and one-time import have been run against a real database and verified, switching the runtime to Prisma would create unnecessary rollback risk.

## Next Safe Step

After this package is reviewed and executed on a real database, the next phase should refactor the route layer from handwritten models to Prisma queries and then delete the legacy model files.
