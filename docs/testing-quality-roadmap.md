# Testing, Quality, And CI Roadmap

This roadmap defines a modern, phased plan for testing the CP Automation application from UI design review through API verification, bug discovery, formatting, and GitHub pipeline automation.

It is written against the current repo state:

- static frontend and admin UI at repo root
- Bun + Express + Prisma backend in `backend/`
- existing API smoke coverage in `backend/scripts/smoke-api.ts`
- existing Lighthouse audit script in `scripts/run-quality-audits.ps1`
- first-party GitHub Actions PR workflow for format, frontend syntax, backend typecheck, and Playwright E2E
- root Prettier baseline configured and enforced in the PR workflow

## Objectives

- prevent regressions before deployment
- catch bugs earlier in pull requests
- verify visual quality, responsive behavior, and accessibility
- verify auth, CRUD, uploads, publishing, and seeded-environment readiness
- standardize formatting and code review quality
- create a CI pipeline that is fast enough for PRs and strict enough for releases

## Testing Principles

- test the highest-risk paths first: auth, publishing, uploads, media replacement, seeded content, and deployment config
- keep fast checks in pull requests and heavier checks in staging/release gates
- use layered testing, not one giant manual checklist
- treat design quality, accessibility, and SEO as release requirements, not extras
- every bug found should produce one of:
  - a test
  - a lint/format/type rule
  - a documented regression check

## Phase 0: Quality Baseline And Inventory

Purpose:

- define what exists
- define what must be tested
- identify gaps in tooling before expanding coverage

Tasks:

- inventory all user journeys:
  - public homepage load
  - public API fallback behavior
  - admin login/logout
  - forgot-password
  - reset-password
  - admin password change
  - CRUD for projects, products, services, testimonials, content sections, page sections
  - media upload and media replacement
  - publishing and unpublishing behavior
- inventory all environments:
  - local
  - staging
  - production
- inventory all quality gates that already exist:
  - `bun run check`
  - `bun run smoke:api`
  - `bun run db:verify:seed`
  - `bun run db:verify:migration`
  - `pwsh -File scripts/run-quality-audits.ps1`
- define test ownership:
  - UI and responsive checks
  - API correctness
  - release verification
  - deployment verification

Deliverables:

- test inventory table
- environment matrix
- release-critical journey list

Exit criteria:

- every major feature has a named test owner and test type

Phase 0 artifact:

- `docs/phase-0-quality-baseline.md`

## Phase 1: Formatting, Repo Hygiene, And Developer Experience

Purpose:

- make diffs smaller
- reduce style noise in reviews
- standardize formatting before scaling testing and CI

Recommendation:

- yes, add Prettier now

Why:

- this repo mixes HTML, CSS, JS, JSON, YAML, Markdown, and TypeScript
- formatting drift will slow reviews once tests and CI grow
- Prettier is low-risk and high-value for this stack

Recommended setup:

- root `.prettierrc.json`
- root `.prettierignore`
- optional `.editorconfig`
- root scripts:
  - `format`
  - `format:check`

Suggested Prettier scope:

- `*.js`
- `*.ts`
- `*.json`
- `*.md`
- `*.html`
- `*.css`
- `*.yml`
- `*.yaml`

Suggested formatting policy:

- run Prettier locally before PR
- block merges if `format:check` fails
- do not auto-format the whole repository in the same PR as feature work
- start with one dedicated formatting baseline PR

Recommended companion rules:

- keep TypeScript typecheck in CI
- add ESLint later only if you want logic and code-smell rules beyond formatting

Exit criteria:

- formatting is deterministic in local development and PRs

Phase 1 artifact:

- `docs/phase-1-formatting-baseline.md`

## Phase 2: UI Design And Visual Quality Testing

Purpose:

- verify that the public site and admin UI look intentional, consistent, readable, and professional across breakpoints

Test areas:

- typography consistency
- spacing rhythm
- button hierarchy and CTA emphasis
- card alignment and overflow handling
- empty states, loading states, and error states
- image cropping and aspect ratio handling
- About page portrait presentation
- admin form readability and field grouping
- nav/sidebar behavior on mobile

Methods:

- manual visual QA using desktop and mobile widths
- screenshot-based review checklist
- per-page review of:
  - homepage hero
  - proof strip
  - About section
  - products
  - services
  - projects
  - testimonials
  - contact CTA
  - admin login
  - admin forgot/reset flows
  - admin dashboard pages

Responsive matrix:

- 360px mobile
- 390px mobile
- 768px tablet
- 1024px small laptop
- 1280px desktop
- 1440px desktop

Browsers:

- Chrome
- Edge
- Safari if available before launch

Bug patterns to search for:

- clipped text
- collapsed spacing
- broken sticky headers
- inaccessible color contrast
- buttons below fold with no cue
- broken anchor scrolling
- carousel controls overlapping content
- long content lines in admin forms

Deliverables:

- UI QA checklist
- screenshot evidence for staging
- design bug backlog with severity labels

Exit criteria:

- no critical visual defects on the main responsive matrix

## Phase 3: Frontend Functional Testing

Purpose:

- verify user-visible behavior on the public site and admin UI

Public site scenarios:

- API-backed homepage renders successfully
- fallback content renders when API fails
- public navigation scrolls correctly
- CTA links point to the right destination
- published items appear
- unpublished items stay hidden
- image loading and responsive asset behavior work
- canonical/meta/OG data updates correctly

Admin scenarios:

- login succeeds with valid credentials
- invalid login is rejected cleanly
- session restoration works
- logout clears session
- forgot-password accepts username/email
- reset-password rejects missing token and invalid token
- account settings change password successfully
- old token/session becomes invalid after password change

Recommended automation approach:

- keep current smoke API coverage
- add browser-based end-to-end coverage with Playwright

Suggested Playwright suites:

- `public.spec.ts`
- `admin-auth.spec.ts`
- `admin-content.spec.ts`
- `admin-media.spec.ts`
- `admin-publishing.spec.ts`

Highest-value Playwright cases:

- admin login
- forgot/reset-password happy path on staging
- project create/update/delete
- media upload and replacement
- product publish/unpublish visibility
- About page edit reflects on public site

Exit criteria:

- critical journeys are covered by repeatable browser automation

Phase 3 artifact:

- `docs/phase-3-frontend-functional-testing.md`

## Phase 4: API And Auth Testing

Purpose:

- verify correctness of backend behavior, auth guards, validation, and publishing rules

What already exists:

- `backend/scripts/smoke-api.ts` covers:
  - health
  - auth guards
  - login and `/auth/me`
  - forgot-password and password-policy validation
  - CRUD for major collections
  - publishing visibility rules
  - uploads and image replacement cleanup

What to add next:

- focused route-level automated tests for:
  - validation errors
  - malformed payloads
  - duplicate keys
  - 404 behavior
  - unauthorized vs forbidden behavior
  - singleton update constraints
  - page-section schema/content validation

Recommended API test layers:

- smoke tests:
  - one end-to-end script against a live API
- route integration tests:
  - run against a test database
- contract checks:
  - verify response shape for key admin/public endpoints

Key API areas:

- auth:
  - login
  - auth guards
  - token invalidation after password change
  - forgot-password generic response behavior
  - reset token expiry and single-use logic
- public content:
  - fallback behavior
  - published-only responses
- admin CRUD:
  - create
  - update
  - delete
  - order index behavior
- media:
  - upload success
  - alt text/title update
  - replacement deletes prior media metadata
  - missing Cloudinary config behavior

Exit criteria:

- every critical route has either smoke coverage, integration coverage, or both

## Phase 5: Seed, Migration, And Environment Testing

Purpose:

- verify that a clean environment can be created from zero reliably

Critical workflows:

- new database
- migrate schema
- seed all content
- verify seeded state
- run smoke tests
- deploy to staging

What to test:

- `bun run prisma:generate`
- `bun run prisma:migrate:deploy`
- `bun run db:seed`
- each scoped seed command
- `bun run db:verify:scopes`
- `bun run db:verify:seed`
- `bun run db:verify:migration`
- `bun run smoke:api`

Seed-specific checks:

- admin user exists and can log in
- singleton records exist
- media metadata records exist
- product/service/project/testimonial counts are non-zero
- page sections and content sections exist
- scoped seeds do not fail due to missing dependencies

Recommended staging rule:

- every production release candidate must pass a clean staging rebuild from zero

Exit criteria:

- staging can be recreated from an empty database without manual SQL patches

## Phase 6: Bug Hunting And Regression Search

Purpose:

- move beyond happy paths and actively search for defects

Bug hunt methods:

- exploratory testing sessions
- negative input testing
- device and browser rotation
- network throttling
- API failure simulation
- stale content and cache validation

Bug classes to search intentionally:

- auth/session bugs
- stale cache bugs
- race conditions after save or publish
- missing fallback content
- hidden-field serialization bugs
- upload replacement orphaning
- broken anchor or route rewrites on Vercel
- CORS failures between Vercel and Render
- seed order dependency bugs
- production-only env bugs

Recommended workflow:

- log every bug with:
  - environment
  - repro steps
  - expected result
  - actual result
  - screenshot or console output
  - severity
  - suspected layer: UI, API, data, deploy, content
- each resolved bug should add:
  - a smoke test
  - an automated test
  - or a release checklist item

Severity model:

- critical: blocks login, publishing, deploy, or public rendering
- high: major feature broken but workaround exists
- medium: UX or validation issue with limited blast radius
- low: polish issue

Exit criteria:

- bug backlog is triaged and critical/high issues are closed before release

Phase 6 artifact:

- `docs/phase-6-bug-hunting-regression-search.md`

## Phase 7: Accessibility, SEO, And Performance

Purpose:

- verify professional launch quality, not just functional correctness

Accessibility checks:

- semantic headings
- button and link labels
- form label association
- keyboard navigation
- focus visibility
- modal/carousel control usability
- alt text on content imagery
- contrast ratios

SEO checks:

- unique titles and descriptions
- canonical URL correctness
- Open Graph defaults
- image alt text quality
- published content visibility only
- fallback metadata behavior if API fails

Performance checks:

- Lighthouse mobile and desktop
- Core Web Vitals review
- image optimization behavior
- JS payload sanity
- cache header verification

Use current audit tooling:

- `pwsh -File scripts/run-quality-audits.ps1 -SiteUrl <url>`

Recommended thresholds:

- performance: 80+ target on mobile, 90+ target on desktop where practical
- accessibility: 95+
- best practices: 95+
- SEO: 95+

Exit criteria:

- quality thresholds are defined and enforced for staging and release

## Phase 8: Security And Operational Testing

Purpose:

- reduce launch risk from auth, secrets, and deployment behavior

Checks:

- secret values are not committed
- reset links are not logged in production
- CORS allows only intended frontend origins
- admin pages are not cached aggressively
- upload size limits are enforced
- invalid media is rejected
- unauthorized admin endpoints return `401`
- token invalidation works after password rotation
- production error logging includes request IDs

Operational tests:

- Render health check stays green after deploy
- Vercel points to the correct Render API base URL
- runtime-config regeneration works on redeploy
- rollback process is documented and usable

Exit criteria:

- security and deploy risk checks are part of release sign-off

## Phase 9: GitHub Pipeline Workflow

Purpose:

- automate repeatable checks on every pull request and release

Current state:

- a first-party PR workflow is present for formatting, frontend syntax, Prisma generation, backend typecheck, and Playwright E2E
- a staging backend verification workflow is present for migration deploy, seeding, seed verification, and smoke checks
- release workflow and frontend staging quality gates are still pending

Recommended workflow structure:

### Workflow 1: Pull Request Quality

Trigger:

- `pull_request`

Jobs:

- `format`
  - setup Bun
  - run `bun install --frozen-lockfile`
  - run `bun run format:check`
- `backend-typecheck`
  - setup Bun
  - install backend deps
  - run `bun run prisma:generate`
  - run `bun run check`
- `frontend-syntax`
  - run `bun run syntax:check`
- `playwright-e2e`
  - setup Bun
  - run `bun install --frozen-lockfile`
  - install Playwright Chromium
  - run `bun run test:e2e`

Goal:

- fast feedback in under a few minutes

### Workflow 2: Staging Verification

Trigger:

- push to `main`
- manual `workflow_dispatch`

Jobs:

- everything in PR quality
- build frontend runtime config
- deploy staging backend
- deploy staging frontend
- run:
  - `bun run db:verify:seed`
  - `bun run smoke:api`
  - Lighthouse audit script against staging

Goal:

- prove the release candidate works in an environment close to production

### Workflow 3: Production Release Gate

Trigger:

- manual approval
- release tag

Jobs:

- confirm staging passed
- run production migration
- verify health endpoint
- run post-deploy smoke tests

Goal:

- avoid shipping without a verified gate

## Recommended GitHub Actions Evolution

Step 1:

- complete: add one basic PR workflow for format, frontend syntax, and backend typecheck

Step 2:

- complete: add Playwright browser checks for public rendering, admin auth, and About-page content updates

Step 3:

- complete: add backend smoke checks against a staged URL using secrets

Step 4:

- add Lighthouse checks

Step 5:

- add release-gated deploy workflow

## Suggested Immediate Next Implementation Order

1. Add Playwright for admin/public browser flows.
2. Expand API testing beyond smoke checks into route-level tests.
3. Add staging workflow for seed verification and smoke tests against a deployed environment.
4. Add Lighthouse checks to the staging workflow.
5. Make staging pass a required release gate before production.
6. Add a release-gated production workflow.

Current implementation status:

- Step 1: complete
- Step 2: complete
- Step 3: complete
- Step 4: next recommended step

Phase 9 artifact:

- `docs/phase-9-pr-quality-workflow.md`

## Definition Of Done For This App

The application is professionally tested when all of the following are true:

- code formatting is enforced
- backend typecheck passes in CI
- seeded environment can be recreated from zero
- auth, CRUD, uploads, publishing, and password recovery are covered
- public site and admin UI pass responsive checks
- accessibility and SEO are reviewed on staging
- Lighthouse thresholds are enforced
- GitHub pipeline blocks low-quality merges
- production deploys follow a documented, staged release path
