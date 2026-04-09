# Phase 0 Quality Baseline

This document is the Phase 0 deliverable for testing and quality planning.

It records:

- the current application surfaces that exist today
- the environments that must be tested
- the quality gates already present in the repository
- the highest-risk journeys that must be protected before release
- a role-based ownership model that can later be mapped to real team members

## Current Application Scope

Public application surfaces currently present:

- homepage hero and proof content
- About section
- products listing
- services listing
- projects listing
- custom solutions section
- testimonials section
- contact CTA and footer
- API-backed content rendering with graceful fallback defaults

Admin application surfaces currently present:

- login screen
- dashboard overview
- site settings editor
- home page editor
- About page editor
- projects CRUD
- products CRUD
- services CRUD
- testimonials CRUD
- legacy content sections CRUD
- account settings password-change page
- forgot-password page
- reset-password page

Backend service surfaces currently present:

- health endpoint
- auth endpoints
- public and admin CRUD routes for projects, products, services, testimonials, content sections, media, singleton pages, and page sections
- Prisma seed and migration verification scripts
- API smoke suite

Known Phase 0 gap:

- the backend exposes `page-sections` CRUD and the public site consumes those sections, but there is no dedicated admin page for page-section management in the current dashboard navigation.

## Current Quality Gates

The repository already includes these executable quality gates:

| Gate                        | Command                                                    | Current Purpose                                                                | Scope            |
| --------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------- |
| Backend type safety         | `bun run check`                                            | TypeScript compile-time verification                                           | backend          |
| Prisma client generation    | `bun run prisma:generate`                                  | regenerate Prisma client after schema changes                                  | backend          |
| Migration verification      | `bun run db:verify:migration`                              | verify Prisma migration state                                                  | backend/database |
| Seed verification           | `bun run db:verify:seed`                                   | confirm a clean seeded environment is valid                                    | backend/database |
| API smoke coverage          | `bun run smoke:api`                                        | exercise auth, CRUD, publishing, uploads, and image replacement                | backend/API      |
| Lighthouse audit            | `pwsh -File scripts/run-quality-audits.ps1 -SiteUrl <url>` | performance, accessibility, best practices, SEO                                | frontend/staging |
| Frontend syntax spot checks | `node --check <file>`                                      | syntax safety for browser JS files                                             | frontend/admin   |
| Playwright browser suite    | `bun run test:e2e`                                         | browser validation for public rendering, admin auth, and content editing       | frontend/admin   |
| GitHub PR workflow          | `.github/workflows/pr-quality.yml`                         | pull-request checks for format, frontend syntax, typecheck, and Playwright E2E | repo/CI          |

Current quality gaps:

| Gap                            | Current State                                                                                                                                                            | Risk                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Formatter enforcement          | Prettier is configured, the repository has been formatted, and the PR workflow runs `format:check`, but branch protection still needs to require that check before merge | drift can still return if CI results are bypassed         |
| CI                             | PR workflow exists and backend staging verification is automated, but release workflow and frontend staging gates are not in place yet                                   | release verification still relies partly on manual checks |
| Browser E2E                    | A Playwright baseline exists for public rendering, admin auth, and About-page editing, but media, publishing, and broader CRUD coverage are still missing                | some UI regressions can still slip through                |
| API integration tests          | Smoke coverage exists, but no route-level automated suite                                                                                                                | edge-case regressions can slip through                    |
| Page-section admin UI coverage | backend route exists without dedicated admin page                                                                                                                        | content operations can be incompletely tested from UI     |

## Test Ownership Model

This is a role-based ownership map for now. Replace roles with real names later.

| Ownership Area           | Default Role      | Responsibility                                                         |
| ------------------------ | ----------------- | ---------------------------------------------------------------------- |
| UI and responsive checks | Frontend QA Owner | public site layout, admin layout, responsiveness, interaction polish   |
| Accessibility and SEO    | Frontend QA Owner | headings, labels, alt text, keyboard flow, metadata validation         |
| API correctness          | Backend QA Owner  | route validation, auth guards, CRUD correctness, publishing visibility |
| Database and seeds       | Backend QA Owner  | migrations, seed flow, clean-environment rebuild, verification scripts |
| Release verification     | Release Owner     | staging sign-off, launch checklist, rollback readiness                 |
| Deployment verification  | Platform Owner    | Vercel/Render config, envs, health checks, runtime config correctness  |

## Test Inventory Table

The table below defines the Phase 0 baseline inventory for what exists and what must be tested.

| ID    | Journey / Feature                                                               | Surface                    | Risk     | Environments                    | Current Coverage                                                 | Required Next Test Type                               | Owner             |
| ----- | ------------------------------------------------------------------------------- | -------------------------- | -------- | ------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- | ----------------- |
| Q0-01 | Public homepage loads with live API data                                        | Public UI                  | Critical | local, staging, production      | manual + smoke-adjacent                                          | browser E2E + manual responsive QA                    | Frontend QA Owner |
| Q0-02 | Public homepage falls back gracefully when API fails                            | Public UI                  | Critical | local, staging                  | code path exists, no formal test                                 | browser E2E with mocked API failure                   | Frontend QA Owner |
| Q0-03 | Public navigation scrolls and internal routes resolve correctly                 | Public UI                  | High     | local, staging, production      | manual                                                           | browser E2E + responsive QA                           | Frontend QA Owner |
| Q0-04 | Published products/services/projects/testimonials/page sections appear publicly | Public UI + API            | Critical | local, staging, production      | API smoke partially covers products, testimonials, page sections | browser E2E + API integration                         | Backend QA Owner  |
| Q0-05 | Unpublished content stays hidden from the public site                           | Public UI + API            | Critical | local, staging, production      | API smoke partially covers this                                  | API integration + browser E2E                         | Backend QA Owner  |
| Q0-06 | Admin login succeeds and invalid login is rejected                              | Admin UI + API             | Critical | local, staging, production      | API smoke covers login; manual UI                                | browser E2E + API integration                         | Backend QA Owner  |
| Q0-07 | Admin session restore and logout work correctly                                 | Admin UI                   | High     | local, staging, production      | manual                                                           | browser E2E                                           | Frontend QA Owner |
| Q0-08 | Forgot-password request works with generic response                             | Admin UI + API             | Critical | local, staging, production      | API smoke covers route                                           | browser E2E + API integration                         | Backend QA Owner  |
| Q0-09 | Reset-password rejects invalid/expired tokens and accepts valid token           | Admin UI + API             | Critical | local, staging, production      | API smoke covers invalid token only                              | browser E2E on staging + API integration              | Backend QA Owner  |
| Q0-10 | Admin password change rotates credentials and invalidates old session           | Admin UI + API             | Critical | local, staging, production      | API smoke covers auth guard only                                 | browser E2E + API integration                         | Backend QA Owner  |
| Q0-11 | Site settings update reflects on public site                                    | Admin UI + Public UI + API | Critical | local, staging                  | manual                                                           | browser E2E + content verification checklist          | Frontend QA Owner |
| Q0-12 | Home page update reflects on public site                                        | Admin UI + Public UI + API | Critical | local, staging                  | manual                                                           | browser E2E                                           | Frontend QA Owner |
| Q0-13 | About page update, portrait upload, and founder content render correctly        | Admin UI + Public UI + API | Critical | local, staging                  | manual                                                           | browser E2E + responsive QA                           | Frontend QA Owner |
| Q0-14 | Project CRUD including image upload and replacement cleanup                     | Admin UI + API + media     | Critical | local, staging                  | API smoke covers route behavior                                  | browser E2E + API integration                         | Backend QA Owner  |
| Q0-15 | Product CRUD and publish/unpublish workflow                                     | Admin UI + API             | Critical | local, staging                  | API smoke covers route behavior                                  | browser E2E + API integration                         | Backend QA Owner  |
| Q0-16 | Service CRUD workflow                                                           | Admin UI + API             | High     | local, staging                  | API smoke covers route behavior                                  | browser E2E + API integration                         | Backend QA Owner  |
| Q0-17 | Testimonial CRUD and publish/unpublish workflow                                 | Admin UI + API             | High     | local, staging                  | API smoke covers route behavior                                  | browser E2E + API integration                         | Backend QA Owner  |
| Q0-18 | Legacy content section CRUD workflow                                            | Admin UI + API             | Medium   | local, staging                  | API smoke covers route behavior                                  | browser E2E + API integration                         | Backend QA Owner  |
| Q0-19 | Page-section CRUD endpoints behave correctly                                    | API only today             | High     | local, staging                  | API smoke covers route behavior                                  | dedicated route integration tests                     | Backend QA Owner  |
| Q0-20 | Media upload metadata update and delete                                         | Admin/API                  | Critical | local, staging                  | API smoke covers this                                            | API integration + admin UI test when media UI expands | Backend QA Owner  |
| Q0-21 | Clean database can be migrated and seeded from zero                             | Database/ops               | Critical | local, staging, production prep | verification scripts exist                                       | staging rebuild rehearsal                             | Release Owner     |
| Q0-22 | Vercel runtime config points frontend/admin to correct Render API               | Deploy/runtime             | Critical | staging, production             | manual                                                           | deployment verification checklist                     | Platform Owner    |
| Q0-23 | Lighthouse thresholds pass on deployed frontend                                 | Public UI                  | High     | staging, production             | audit script exists                                              | automated staging gate                                | Frontend QA Owner |
| Q0-24 | Production logging, cache behavior, and health check remain intact after deploy | Ops/runtime                | High     | staging, production             | manual + health endpoint                                         | release verification checklist                        | Platform Owner    |

## Environment Matrix

| Environment | Purpose                                            | Data Profile                                                                                          | Required Checks                                                                                                                                  | Release Significance                        |
| ----------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Local       | daily development and quick regression checks      | seeded or developer data, placeholder envs allowed                                                    | `bun run check`, `bun run prisma:generate`, `bun run db:verify:seed`, `bun run smoke:api`, targeted UI checks                                    | fast feedback, not a release gate by itself |
| Staging     | production rehearsal with real deployment topology | clean or refreshed staging database, real Cloudinary, real Vercel/Render URLs, non-production secrets | migration deploy, full seed, seed verification, smoke suite, auth flow checks, upload tests, password recovery checks, Lighthouse, responsive QA | primary release gate                        |
| Production  | live customer-facing environment                   | live approved content, production secrets, production database                                        | health check, post-deploy smoke subset, runtime config verification, logging review, rollback readiness                                          | final launch target                         |

Additional environment rules:

- staging must mirror the production topology:
  - Vercel frontend
  - Render backend
  - Postgres
  - Cloudinary
- production should not be the first place where migrations, seeded content, or runtime config are validated
- local may use placeholder password reset delivery behavior, but staging and production require explicit validation of the intended reset-delivery path

## Release-Critical Journeys

These are the journeys that must pass before launch or any high-confidence release candidate.

1. Public homepage renders correctly with live API content.
2. Public homepage degrades safely to fallback content if the API is unavailable.
3. Admin login works with valid credentials and rejects invalid credentials cleanly.
4. Admin logout and session restoration work without stale-session bugs.
5. Forgot-password, reset-password, and account password change flows behave correctly.
6. Site settings, home page, and About page edits publish correctly to the public site.
7. Project CRUD works, including upload, image replacement, and orphan cleanup.
8. Product, service, and testimonial publish/unpublish logic works as expected.
9. A clean staging database can be migrated, seeded, verified, and smoke-tested from zero.
10. Deployed Vercel and Render environments point to the correct API and pass health, smoke, and Lighthouse checks.

## Phase 0 Exit Assessment

Phase 0 is considered complete when all of the following are true:

- the app surfaces are inventoried
- the environments are defined
- the current quality gates are listed
- quality gaps are listed
- each major feature has a test type and owner
- release-critical journeys are explicitly named

Current Phase 0 status after this baseline:

- test inventory table: complete
- environment matrix: complete
- release-critical journeys: complete
- role-based ownership model: complete
- identified gaps and ambiguities: complete

## Recommended Immediate Next Step

Begin Phase 2 with these implementation items in order:

1. Expand browser E2E coverage into media, publishing, and broader admin CRUD flows.
2. Add deeper API integration coverage around route behavior and auth edge cases.
3. Add staging verification for seeded rebuilds, smoke checks, and Lighthouse audits.
