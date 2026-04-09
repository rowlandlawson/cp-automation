# Phase 1 Formatting Baseline

Phase 1 is now implemented at the repository root.

## What Was Added

- root Prettier config: `.prettierrc.json`
- root Prettier ignore file: `.prettierignore`
- root editor settings: `.editorconfig`
- root package scripts:
  - `bun run format`
  - `bun run format:check`

## Why This Setup

- the repo mixes frontend browser files, backend TypeScript, JSON, Markdown, YAML, and HTML
- formatting drift would create noisy diffs as CI and automated tests expand
- the config uses directory-aware indentation so the existing frontend/admin style and backend style do not fight each other as much

## How To Use It

Install root dependencies once:

```bash
bun install
```

Then use:

```bash
bun run format
bun run format:check
```

## Current Policy

- use `bun run format` before opening a formatting-focused PR
- use `bun run format:check` in CI to prevent formatting drift
- do not combine a full-repo formatting sweep with unrelated feature work
- generated files and build artifacts are excluded through `.prettierignore`

## Status

Phase 1 now includes:

- Prettier installation at the repository root
- root `bun.lock` for deterministic Bun installs
- formatter scripts in `package.json`
- repository-wide formatting pass
- successful `bun run format:check` verification after formatting

## Formatter Choice

This repository now uses Prettier as the formatter baseline.

Prettier is the right default here because:

- the project is a mixed static-site and Bun backend stack
- the current problem is formatting consistency more than linting depth
- it already works cleanly across HTML, CSS, JS, TS, Markdown, JSON, and YAML in this repo

Biome is not required right now. If you want stronger lint-style rules later, we can evaluate Biome or ESLint separately without undoing this baseline.

The next improvement after this Phase 1 baseline is broader CI coverage, especially browser E2E checks and staging verification.
