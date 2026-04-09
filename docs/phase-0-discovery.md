# Phase 0 Discovery, Backup, and Content Inventory

Generated on 2026-04-03.

## Executive Summary

The codebase is ready for a Prisma migration, but the project is not yet backup-ready. The current backend still uses handwritten SQL and raw `pg` models. The public website still mixes hardcoded content with a partially API-driven frontend. Before schema migration, we need a real Neon connection string, real secrets, and a verified database backup.

## Current Readiness

### Database backup readiness

Status: blocked

Reasons:

- `backend/.env` still matches the placeholder `DATABASE_URL` pattern.
- `backend/.env` still matches the placeholder `JWT_SECRET` pattern.
- `backend/.env` still matches the placeholder Cloudinary values.
- `pg_dump` is not installed on this machine.

Prepared assets:

- Backup script: `backend/scripts/backup-database.ps1`
- Backup output folder: `backend/backups/`

### Current backend data layer

Current implementation:

- Raw SQL schema in `backend/config/database.sql`
- Handwritten models in `backend/models/*.ts`
- Handwritten CRUD routes in `backend/routes/*.ts`

Migration implication:

- Prisma should replace the handwritten model layer after the new schema is finalized and data is migrated.

## Recommendation for About

Recommended decision:

- Keep a short About summary on the homepage.
- Add a dedicated `/about` page with richer editorial content.

Why this is the best option:

- The homepage still needs a compact trust-building overview.
- The business needs room for founder/admin profile, portrait, mission, story, values, and credibility on a dedicated page.
- The admin dashboard requirements already imply richer About content and image management than a homepage summary can hold cleanly.

## Editable Section Inventory

These sections should be moved to the database so no meaningful website copy remains hardcoded.

### Site-wide content

- Site settings
  - Company name
  - Phone number
  - WhatsApp number
  - Email
  - Address
  - Social links
  - Logo
  - Footer motto and tagline
- SEO settings
  - Site title
  - Default meta description
  - Open Graph image

### Homepage

- Hero
  - Heading
  - Subheading
  - Primary CTA label and URL
  - Secondary CTA label and URL
  - Hero stats
- About summary
  - Section title
  - Intro text
  - Mission card
  - Why choose us card
- Products section
  - Section title
  - Intro text
  - Product collection
- Services section
  - Section title
  - Intro text
  - Service collection
- Projects section
  - Section title
  - Intro text
  - Project collection
- Custom solutions section
  - Title
  - Intro text
  - Features list
  - Process steps
  - CTA
- Testimonials section
  - Title
  - Intro text
  - Testimonial collection
- Contact CTA section
  - Title
  - Body copy
  - CTA labels and URLs

### Dedicated About page

- Founder/admin profile
  - Full name
  - Role/title
  - Portrait image
  - Short bio
  - Long story
- Company background
  - Mission
  - Vision
  - Core values
  - Experience stats
  - Service locations
  - Credibility points

### Footer

- Motto
- Tagline
- Company summary
- Quick links
- Product highlight links
- Contact block
- Social links

## Current Content Source Matrix

| Section              | Current Source              | Current State            | Recommended Target                        |
| -------------------- | --------------------------- | ------------------------ | ----------------------------------------- |
| Hero                 | `index.html`                | Hardcoded                | `HomePage` singleton                      |
| About summary        | `index.html`                | Hardcoded                | `HomePage` + `AboutPage`                  |
| Products             | API + fallback HTML         | Mixed                    | `Product` + homepage section metadata     |
| Services             | API + fallback HTML         | Mixed                    | `Service` + homepage section metadata     |
| Projects             | API + fallback HTML         | Mixed                    | `Project`                                 |
| Custom solutions     | `index.html`                | Hardcoded                | `HomePage` or `PageSection`               |
| Testimonials         | API + fallback HTML         | Mixed                    | `Testimonial` + homepage section metadata |
| Contact CTA          | `index.html`                | Hardcoded                | `SiteSettings` + `HomePage`               |
| Footer               | `index.html`                | Hardcoded                | `SiteSettings`                            |
| Admin content editor | `admin/js/pages/content.js` | Generic text blocks only | Structured page CMS                       |

## Media Inventory

### Used on the public site

- `assets/img/logo.jpg`
- `assets/img/28748.jpg`
- `assets/img/28752.jpg`
- `assets/img/28753.jpg`
- `assets/img/28758.jpg`
- Responsive variants:
  - `assets/img/28748-small.jpg`
  - `assets/img/28752-small.jpg`
  - `assets/img/28753-small.jpg`
  - `assets/img/28758-small.jpg`

### Present but currently unused in the public markup

- `assets/img/28756.jpg`

## Admin CMS Gaps

Current admin coverage:

- Login/auth flow exists.
- CRUD exists for projects, products, services, testimonials, and generic content sections.

Missing admin coverage:

- Site settings editor
- Homepage editor
- Dedicated About page editor
- Founder/admin portrait upload
- Footer/social/contact editor
- SEO fields editor
- Structured CTA editor
- Publish/draft workflow for singleton pages

## What Must Happen Before Phase 1

Required before Prisma migration starts:

- Replace placeholder values in `backend/.env`
- Install PostgreSQL client tools so `pg_dump` is available
- Run a real Neon backup
- Confirm the About decision:
  - recommended: homepage summary + dedicated `/about`
- Confirm the list of business-owned content inputs:
  - admin/founder name
  - title
  - portrait
  - updated bio
  - official contact details
  - social links
  - approved testimonials

## Immediate Next Step

Once the real Neon credentials are available, run:

```powershell
cd backend
.\scripts\backup-database.ps1
```

After the backup is verified, the project is ready for Prisma foundation work.
