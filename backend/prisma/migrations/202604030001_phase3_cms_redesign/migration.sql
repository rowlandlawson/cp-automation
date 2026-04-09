-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "MediaAssetType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "PageType" AS ENUM ('HOME', 'ABOUT', 'GLOBAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- DropIndex
DROP INDEX IF EXISTS "idx_testimonials_published_order";

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "image_asset_id" INTEGER,
ADD COLUMN     "meta_description" VARCHAR(320),
ADD COLUMN     "meta_title" VARCHAR(255),
ADD COLUMN     "og_image_asset_id" INTEGER,
ADD COLUMN     "slug" VARCHAR(255);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "cta_label" VARCHAR(120),
ADD COLUMN     "cta_url" VARCHAR(500),
ADD COLUMN     "feature_list" JSONB,
ADD COLUMN     "featured_asset_id" INTEGER,
ADD COLUMN     "meta_description" VARCHAR(320),
ADD COLUMN     "meta_title" VARCHAR(255),
ADD COLUMN     "og_image_asset_id" INTEGER,
ADD COLUMN     "slug" VARCHAR(255);

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "cta_label" VARCHAR(120),
ADD COLUMN     "cta_url" VARCHAR(500),
ADD COLUMN     "featured_asset_id" INTEGER,
ADD COLUMN     "highlight_list" JSONB,
ADD COLUMN     "meta_description" VARCHAR(320),
ADD COLUMN     "meta_title" VARCHAR(255),
ADD COLUMN     "og_image_asset_id" INTEGER,
ADD COLUMN     "slug" VARCHAR(255);

-- AlterTable
ALTER TABLE "testimonials" ADD COLUMN     "author_role" VARCHAR(255),
ADD COLUMN     "company_name" VARCHAR(255),
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "source_url" VARCHAR(500);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "alt_text" VARCHAR(255),
    "file_name" VARCHAR(255),
    "url" VARCHAR(1000) NOT NULL,
    "secure_url" VARCHAR(1000),
    "public_id" VARCHAR(255),
    "folder" VARCHAR(255),
    "asset_type" "MediaAssetType" NOT NULL DEFAULT 'IMAGE',
    "mime_type" VARCHAR(120),
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "uploaded_by_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "company_name" VARCHAR(255) NOT NULL,
    "site_tagline" VARCHAR(255),
    "company_summary" TEXT,
    "phone" VARCHAR(50),
    "whatsapp_number" VARCHAR(50),
    "whatsapp_link" VARCHAR(500),
    "email" VARCHAR(255),
    "address" VARCHAR(255),
    "social_links" JSONB,
    "footer_motto" VARCHAR(255),
    "footer_tagline" TEXT,
    "footer_summary" TEXT,
    "footer_quick_links" JSONB,
    "footer_product_links" JSONB,
    "logo_asset_id" INTEGER,
    "default_og_image_asset_id" INTEGER,
    "meta_title" VARCHAR(255),
    "meta_description" VARCHAR(320),
    "canonical_base_url" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_pages" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "slug" VARCHAR(100) NOT NULL DEFAULT 'home',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "hero_eyebrow" VARCHAR(120),
    "hero_heading" VARCHAR(255) NOT NULL,
    "hero_subheading" TEXT,
    "hero_primary_cta_label" VARCHAR(120),
    "hero_primary_cta_url" VARCHAR(500),
    "hero_secondary_cta_label" VARCHAR(120),
    "hero_secondary_cta_url" VARCHAR(500),
    "hero_stats" JSONB,
    "hero_visual_asset_id" INTEGER,
    "about_summary_title" VARCHAR(255),
    "about_summary_subtitle" TEXT,
    "about_summary_cta_label" VARCHAR(120),
    "about_summary_cta_url" VARCHAR(500),
    "about_mission_title" VARCHAR(255),
    "about_mission_body" TEXT,
    "about_why_choose_title" VARCHAR(255),
    "about_why_choose_points" JSONB,
    "products_section_title" VARCHAR(255),
    "products_section_intro" TEXT,
    "services_section_title" VARCHAR(255),
    "services_section_intro" TEXT,
    "projects_section_title" VARCHAR(255),
    "projects_section_intro" TEXT,
    "testimonials_section_title" VARCHAR(255),
    "testimonials_section_intro" TEXT,
    "custom_solutions_title" VARCHAR(255),
    "custom_solutions_subtitle" TEXT,
    "custom_solutions_development_title" VARCHAR(255),
    "custom_solutions_development_body" TEXT,
    "custom_solutions_features" JSONB,
    "custom_solutions_process_title" VARCHAR(255),
    "custom_solutions_process_steps" JSONB,
    "custom_solutions_cta_label" VARCHAR(120),
    "custom_solutions_cta_url" VARCHAR(500),
    "contact_cta_title" VARCHAR(255),
    "contact_cta_body" TEXT,
    "contact_cta_actions" JSONB,
    "meta_title" VARCHAR(255),
    "meta_description" VARCHAR(320),
    "og_image_asset_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "home_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_pages" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "slug" VARCHAR(100) NOT NULL DEFAULT 'about',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "page_title" VARCHAR(255),
    "page_subtitle" TEXT,
    "founder_name" VARCHAR(255) NOT NULL,
    "founder_role" VARCHAR(255),
    "portrait_asset_id" INTEGER,
    "short_bio" TEXT,
    "long_story" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "values" JSONB,
    "certifications" JSONB,
    "years_of_experience" INTEGER,
    "stats" JSONB,
    "service_locations" JSONB,
    "credibility_points" JSONB,
    "primary_cta_label" VARCHAR(120),
    "primary_cta_url" VARCHAR(500),
    "meta_title" VARCHAR(255),
    "meta_description" VARCHAR(320),
    "og_image_asset_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "about_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_sections" (
    "id" SERIAL NOT NULL,
    "page_type" "PageType" NOT NULL,
    "section_key" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255),
    "subtitle" TEXT,
    "body" TEXT,
    "content" JSONB,
    "cta_label" VARCHAR(120),
    "cta_url" VARCHAR(500),
    "featured_asset_id" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_public_id_key" ON "media_assets"("public_id");

-- CreateIndex
CREATE INDEX "idx_media_assets_type_folder" ON "media_assets"("asset_type", "folder");

-- CreateIndex
CREATE INDEX "idx_media_assets_uploaded_by" ON "media_assets"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "idx_site_settings_logo_asset" ON "site_settings"("logo_asset_id");

-- CreateIndex
CREATE INDEX "idx_site_settings_og_image_asset" ON "site_settings"("default_og_image_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "home_pages_slug_key" ON "home_pages"("slug");

-- CreateIndex
CREATE INDEX "idx_home_pages_published" ON "home_pages"("is_published");

-- CreateIndex
CREATE INDEX "idx_home_pages_hero_asset" ON "home_pages"("hero_visual_asset_id");

-- CreateIndex
CREATE INDEX "idx_home_pages_og_image_asset" ON "home_pages"("og_image_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "about_pages_slug_key" ON "about_pages"("slug");

-- CreateIndex
CREATE INDEX "idx_about_pages_published" ON "about_pages"("is_published");

-- CreateIndex
CREATE INDEX "idx_about_pages_portrait_asset" ON "about_pages"("portrait_asset_id");

-- CreateIndex
CREATE INDEX "idx_about_pages_og_image_asset" ON "about_pages"("og_image_asset_id");

-- CreateIndex
CREATE INDEX "idx_page_sections_page_type_published_order" ON "page_sections"("page_type", "is_published", "order_index");

-- CreateIndex
CREATE INDEX "idx_page_sections_featured_asset" ON "page_sections"("featured_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "page_sections_page_type_section_key_key" ON "page_sections"("page_type", "section_key");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "idx_projects_image_asset" ON "projects"("image_asset_id");

-- CreateIndex
CREATE INDEX "idx_projects_og_image_asset" ON "projects"("og_image_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "idx_products_featured_asset" ON "products"("featured_asset_id");

-- CreateIndex
CREATE INDEX "idx_products_og_image_asset" ON "products"("og_image_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "idx_services_featured_asset" ON "services"("featured_asset_id");

-- CreateIndex
CREATE INDEX "idx_services_og_image_asset" ON "services"("og_image_asset_id");

-- CreateIndex
CREATE INDEX "idx_testimonials_published_featured_order" ON "testimonials"("is_published", "is_featured", "order_index", "created_at");

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_image_asset_id_fkey" FOREIGN KEY ("image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_og_image_asset_id_fkey" FOREIGN KEY ("og_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_featured_asset_id_fkey" FOREIGN KEY ("featured_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_og_image_asset_id_fkey" FOREIGN KEY ("og_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_featured_asset_id_fkey" FOREIGN KEY ("featured_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_og_image_asset_id_fkey" FOREIGN KEY ("og_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_asset_id_fkey" FOREIGN KEY ("logo_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_og_image_asset_id_fkey" FOREIGN KEY ("default_og_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_pages" ADD CONSTRAINT "home_pages_hero_visual_asset_id_fkey" FOREIGN KEY ("hero_visual_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_pages" ADD CONSTRAINT "home_pages_og_image_asset_id_fkey" FOREIGN KEY ("og_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_pages" ADD CONSTRAINT "about_pages_portrait_asset_id_fkey" FOREIGN KEY ("portrait_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_pages" ADD CONSTRAINT "about_pages_og_image_asset_id_fkey" FOREIGN KEY ("og_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_featured_asset_id_fkey" FOREIGN KEY ("featured_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
