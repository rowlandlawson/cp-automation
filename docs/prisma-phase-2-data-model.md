# Prisma Phase 2 Data Model Redesign

Generated on 2026-04-03.

## Goal

Move from a bridge schema that only mirrors the current raw SQL tables to a target schema that can power:

- seeded content for the full public website
- a structured admin CMS
- reusable media management
- homepage and about-page editing
- SEO-ready public pages and collection entries

## Model Inventory

### Existing collection models retained

- `User`
  - Admin authentication and ownership of uploaded media
- `Project`
  - Gallery/project items with SEO fields and media relations
- `Product`
  - Product catalog entries with CTA fields, feature lists, SEO fields, and media relations
- `Service`
  - Service offerings with optional highlight lists, CTA fields, SEO fields, and media relations
- `Testimonial`
  - Social proof entries with support for featured flags and richer attribution

### New infrastructure model

- `MediaAsset`
  - Stores uploaded asset metadata only
  - Tracks URL, secure URL, public ID, folder, type, alt text, dimensions, MIME type, and uploader
  - Becomes the canonical relation target for project images, about portraits, site logos, and OG images

### New singleton page/site models

- `SiteSettings`
  - Company identity, contact data, footer content, social links, logo, and default SEO
- `HomePage`
  - Structured homepage content:
    - hero
    - about summary
    - product/service/project/testimonial section intros
    - custom solutions content
    - contact CTA
    - page-level SEO
- `AboutPage`
  - Structured dedicated about page content:
    - founder/admin identity
    - portrait
    - short bio
    - long story
    - mission and vision
    - values
    - certifications
    - experience and credibility stats
    - page-level SEO

### New flexible page-content model

- `PageSection`
  - Covers repeated or modular sections that do not fit cleanly into singleton fields
  - Supports:
    - page targeting via `pageType`
    - a stable `sectionKey`
    - optional title, subtitle, body
    - arbitrary structured `content` JSON
    - CTA metadata
    - optional featured media
    - display order and publish state

### Legacy bridge model preserved

- `ContentSection`
  - Kept temporarily because the current admin dashboard still uses it
  - Should be retired after admin screens move to `HomePage`, `AboutPage`, `SiteSettings`, and `PageSection`

## SEO Coverage

SEO fields are now designed into the models that are likely to drive public routes or public-facing previews:

- `Project`
- `Product`
- `Service`
- `SiteSettings`
- `HomePage`
- `AboutPage`

SEO fields used:

- `slug`
- `metaTitle`
- `metaDescription`
- `ogImageAssetId`
- `isPublished`

## Migration Bridge Notes

The redesign intentionally preserves some legacy fields so the migration can happen in controlled steps:

- `Project.imageUrl`
- `Project.imagePublicId`
- `Product.features`
- `ContentSection`

These allow the current raw `pg` code and current admin/public logic to keep functioning while later phases migrate storage and API handlers to Prisma-first models.

## Why This Shape Fits The Site

The discovery inventory showed that the website is not just a list of products and projects. It also needs structured control over:

- homepage hero messaging
- about summary content
- contact and footer information
- founder/admin profile content
- reusable media
- modular editorial sections

That means a pure collection-only schema would be too weak, while a pure JSON-CMS blob would be too hard to validate and maintain. This redesign uses:

- normal relational models for durable business entities
- singleton models for stable pages
- JSON only where repeated editorial structures are genuinely flexible

## Next Phase Dependencies

This redesign unblocks the next phases:

- Phase 3: migration strategy and data move planning
- Phase 4: Prisma seed file for admin login and section-by-section website content
- Phase 5: API refactor from raw `pg` models to Prisma queries
- Phase 6: admin dashboard expansion for homepage, about, site settings, and media
