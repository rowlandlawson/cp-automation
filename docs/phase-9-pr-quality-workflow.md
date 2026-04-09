# Phase 9 PR Quality Workflow

The repository now includes a first-party GitHub Actions pull request workflow at `.github/workflows/pr-quality.yml`.

A separate staging backend verification workflow now exists at `.github/workflows/staging-backend-verification.yml`.

## What It Does

The workflow runs on:

- `pull_request`
- manual `workflow_dispatch`

It currently enforces four pull-request jobs:

1. `Format Check`
   - installs root dependencies with Bun
   - runs `bun run format:check`
2. `Frontend Syntax Check`
   - installs root dependencies with Bun
   - runs `bun run syntax:check`
3. `Backend Prisma And Typecheck`
   - installs backend dependencies with Bun
   - runs `bun run prisma:generate`
   - runs `bun run check`
4. `Playwright E2E`
   - installs root dependencies with Bun
   - installs the Chromium browser used by Playwright
   - runs `bun run test:e2e`

## Local Command Equivalents

Before opening a pull request, run:

```bash
bun install
bun run format:check
bun run syntax:check
bun run test:e2e
cd backend
bun install
bun run prisma:generate
bun run check
```

## Why This Is The Right First Workflow

- it is fast enough for routine pull requests
- it catches formatting drift before review
- it catches browser-JavaScript syntax regressions early
- it keeps Prisma client generation and backend TypeScript safety in the default PR gate
- it now exercises high-risk public and admin browser journeys in Chromium on every pull request
- it stays aligned with the repo's Bun-first setup

## Current Limitations

This workflow does not yet run:

- API smoke tests against a deployed environment
- Lighthouse audits
- frontend staging deploy verification
- production release gates

Those still belong in later phases so pull requests stay fast and reliable, even though backend staging verification now has its own workflow.

## Formatter Choice

This repository now standardizes on Prettier, not Biome.

That choice is intentional for the current stack because:

- the immediate need is consistent formatting across HTML, CSS, JS, TS, JSON, Markdown, and YAML
- Prettier is already configured and passing in this repo
- adding Biome now would create overlapping formatter responsibility without clear extra value

Biome can still be evaluated later if you want lint-style rules and a tighter all-in-one toolchain, but it is not necessary to start enforcing formatting and CI today.

## Recommended Next CI Step

After this baseline, the next best addition is broader release-oriented verification:

- publish/unpublish visibility checks
- one representative admin CRUD flow with uploads
- Lighthouse and frontend checks against the staged deployment
