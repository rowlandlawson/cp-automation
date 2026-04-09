# Phase 3 Frontend Functional Testing

Phase 3 now has a working Playwright baseline in this repository.

## What Was Added

- Playwright configuration at `playwright.config.js`
- a lightweight local static server at `scripts/serve-static-site.mjs`
- reusable API-mocking helpers in `e2e/helpers/`
- initial browser suites in `e2e/tests/`
- root Bun scripts:
  - `bun run test:e2e`
  - `bun run test:e2e:headed`
  - `bun run test:e2e:ui`

## Why This Setup Fits This Repo

The public site and admin are static browser apps that call the backend over HTTP.

That means the most reliable Phase 3 baseline is:

- serve the real HTML, CSS, and browser JavaScript
- intercept API requests in Playwright
- verify user-visible behavior in a real browser

This keeps the tests repeatable without requiring a seeded database, Cloudinary credentials, or a running Render-style backend for every local test run.

Backend correctness is still covered separately by the API smoke suite and the database verification scripts.

## Current Suite Coverage

Implemented now:

- `public.spec.js`
  - API-driven homepage rendering
  - metadata updates from fetched content
  - hidden draft items stay out of the public UI
  - navigation scroll behavior
  - graceful fallback to bundled defaults when the API fails
- `admin-auth.spec.js`
  - invalid login rejection
  - successful login and dashboard render
  - session restoration
  - logout
  - forgot-password request flow
  - reset-password missing-token and invalid-token behavior
  - account settings password change and refreshed session token storage
- `admin-content.spec.js`
  - About-page edit flow from the admin dashboard
  - updated founder/admin profile reflected on the public site

The Playwright suite is also wired into the pull-request workflow, so these browser checks now run in GitHub Actions with Chromium.

## Commands

Install dependencies:

```bash
bun install
```

Run the default headless suite:

```bash
bun run test:e2e
```

Run with a visible browser:

```bash
bun run test:e2e:headed
```

Run the Playwright UI runner:

```bash
bun run test:e2e:ui
```

## Current Limits

Phase 3 is now started well, but not finished completely.

The next expansion items are:

- `admin-media.spec.js`
  - upload validation
  - image replacement
  - preview refresh after upload
- `admin-publishing.spec.js`
  - publish and unpublish workflows
  - visibility changes on the public site
- more editor coverage for:
  - site settings
  - home page
  - products
  - services
  - testimonials

## Recommended Next Step

After this baseline, the strongest next Playwright additions are:

1. product publish/unpublish visibility
2. project create or update flow
3. media upload and replacement behavior
