import { Router } from "express";

import { asyncHandler } from "../middleware/async-handler";
import { auth } from "../middleware/auth";
import { cleanupReplacedMediaAsset } from "../utils/prisma-cleanup";
import { resolveMediaAssetId } from "../utils/prisma-media";
import { parseJsonInput, requirePrisma } from "../utils/prisma-request";
import { serializeHomePage } from "../utils/prisma-serializers";
import {
  nullableId,
  nullableString,
  optionalBoolean,
  optionalString,
  requireString,
} from "../utils/request";

const homePageRouter = Router();

homePageRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const prisma = requirePrisma();
    const page = await prisma.homePage.findUnique({
      where: { id: 1 },
      include: {
        heroVisualAsset: true,
        ogImageAsset: true,
      },
    });

    if (!page) {
      res.status(404).json({ error: "Home page content not found." });
      return;
    }

    res.json(serializeHomePage(page));
  }),
);

homePageRouter.put(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const existingPage = await prisma.homePage.findUnique({
      where: { id: 1 },
      include: {
        heroVisualAsset: true,
        ogImageAsset: true,
      },
    });

    const heroHeading =
      req.body.hero_heading !== undefined
        ? requireString(req.body.hero_heading, "hero_heading")
        : undefined;
    const heroVisualAssetId = await resolveMediaAssetId(
      nullableId(req.body.hero_visual_asset_id, "hero_visual_asset_id"),
      "hero_visual_asset_id",
    );
    const ogImageAssetId = await resolveMediaAssetId(
      nullableId(req.body.og_image_asset_id, "og_image_asset_id"),
      "og_image_asset_id",
    );

    const page = existingPage
      ? await prisma.homePage.update({
          where: { id: 1 },
          data: {
            slug: optionalString(req.body.slug, "slug"),
            isPublished: optionalBoolean(req.body.is_published, "is_published"),
            heroEyebrow: nullableString(req.body.hero_eyebrow, "hero_eyebrow"),
            heroHeading,
            heroSubheading: nullableString(req.body.hero_subheading, "hero_subheading"),
            heroPrimaryCtaLabel: nullableString(
              req.body.hero_primary_cta_label,
              "hero_primary_cta_label",
            ),
            heroPrimaryCtaUrl: nullableString(
              req.body.hero_primary_cta_url,
              "hero_primary_cta_url",
            ),
            heroSecondaryCtaLabel: nullableString(
              req.body.hero_secondary_cta_label,
              "hero_secondary_cta_label",
            ),
            heroSecondaryCtaUrl: nullableString(
              req.body.hero_secondary_cta_url,
              "hero_secondary_cta_url",
            ),
            heroStats: parseJsonInput(req.body.hero_stats, "hero_stats"),
            heroVisualAssetId,
            aboutSummaryTitle: nullableString(req.body.about_summary_title, "about_summary_title"),
            aboutSummarySubtitle: nullableString(
              req.body.about_summary_subtitle,
              "about_summary_subtitle",
            ),
            aboutSummaryCtaLabel: nullableString(
              req.body.about_summary_cta_label,
              "about_summary_cta_label",
            ),
            aboutSummaryCtaUrl: nullableString(
              req.body.about_summary_cta_url,
              "about_summary_cta_url",
            ),
            aboutMissionTitle: nullableString(req.body.about_mission_title, "about_mission_title"),
            aboutMissionBody: nullableString(req.body.about_mission_body, "about_mission_body"),
            aboutWhyChooseTitle: nullableString(
              req.body.about_why_choose_title,
              "about_why_choose_title",
            ),
            aboutWhyChoosePoints: parseJsonInput(
              req.body.about_why_choose_points,
              "about_why_choose_points",
            ),
            productsSectionTitle: nullableString(
              req.body.products_section_title,
              "products_section_title",
            ),
            productsSectionIntro: nullableString(
              req.body.products_section_intro,
              "products_section_intro",
            ),
            servicesSectionTitle: nullableString(
              req.body.services_section_title,
              "services_section_title",
            ),
            servicesSectionIntro: nullableString(
              req.body.services_section_intro,
              "services_section_intro",
            ),
            projectsSectionTitle: nullableString(
              req.body.projects_section_title,
              "projects_section_title",
            ),
            projectsSectionIntro: nullableString(
              req.body.projects_section_intro,
              "projects_section_intro",
            ),
            testimonialsSectionTitle: nullableString(
              req.body.testimonials_section_title,
              "testimonials_section_title",
            ),
            testimonialsSectionIntro: nullableString(
              req.body.testimonials_section_intro,
              "testimonials_section_intro",
            ),
            customSolutionsTitle: nullableString(
              req.body.custom_solutions_title,
              "custom_solutions_title",
            ),
            customSolutionsSubtitle: nullableString(
              req.body.custom_solutions_subtitle,
              "custom_solutions_subtitle",
            ),
            customSolutionsDevelopmentTitle: nullableString(
              req.body.custom_solutions_development_title,
              "custom_solutions_development_title",
            ),
            customSolutionsDevelopmentBody: nullableString(
              req.body.custom_solutions_development_body,
              "custom_solutions_development_body",
            ),
            customSolutionsFeatures: parseJsonInput(
              req.body.custom_solutions_features,
              "custom_solutions_features",
            ),
            customSolutionsProcessTitle: nullableString(
              req.body.custom_solutions_process_title,
              "custom_solutions_process_title",
            ),
            customSolutionsProcessSteps: parseJsonInput(
              req.body.custom_solutions_process_steps,
              "custom_solutions_process_steps",
            ),
            customSolutionsCtaLabel: nullableString(
              req.body.custom_solutions_cta_label,
              "custom_solutions_cta_label",
            ),
            customSolutionsCtaUrl: nullableString(
              req.body.custom_solutions_cta_url,
              "custom_solutions_cta_url",
            ),
            contactCtaTitle: nullableString(req.body.contact_cta_title, "contact_cta_title"),
            contactCtaBody: nullableString(req.body.contact_cta_body, "contact_cta_body"),
            contactCtaActions: parseJsonInput(req.body.contact_cta_actions, "contact_cta_actions"),
            metaTitle: nullableString(req.body.meta_title, "meta_title"),
            metaDescription: nullableString(req.body.meta_description, "meta_description"),
            ogImageAssetId,
          },
          include: {
            heroVisualAsset: true,
            ogImageAsset: true,
          },
        })
      : await prisma.homePage.create({
          data: {
            slug: optionalString(req.body.slug, "slug") ?? "home",
            isPublished: optionalBoolean(req.body.is_published, "is_published") ?? true,
            heroEyebrow: nullableString(req.body.hero_eyebrow, "hero_eyebrow") ?? null,
            heroHeading: heroHeading ?? requireString(req.body.hero_heading, "hero_heading"),
            heroSubheading: nullableString(req.body.hero_subheading, "hero_subheading") ?? null,
            heroPrimaryCtaLabel:
              nullableString(req.body.hero_primary_cta_label, "hero_primary_cta_label") ?? null,
            heroPrimaryCtaUrl:
              nullableString(req.body.hero_primary_cta_url, "hero_primary_cta_url") ?? null,
            heroSecondaryCtaLabel:
              nullableString(req.body.hero_secondary_cta_label, "hero_secondary_cta_label") ?? null,
            heroSecondaryCtaUrl:
              nullableString(req.body.hero_secondary_cta_url, "hero_secondary_cta_url") ?? null,
            heroStats: parseJsonInput(req.body.hero_stats, "hero_stats") ?? undefined,
            heroVisualAssetId: heroVisualAssetId ?? null,
            aboutSummaryTitle:
              nullableString(req.body.about_summary_title, "about_summary_title") ?? null,
            aboutSummarySubtitle:
              nullableString(req.body.about_summary_subtitle, "about_summary_subtitle") ?? null,
            aboutSummaryCtaLabel:
              nullableString(req.body.about_summary_cta_label, "about_summary_cta_label") ?? null,
            aboutSummaryCtaUrl:
              nullableString(req.body.about_summary_cta_url, "about_summary_cta_url") ?? null,
            aboutMissionTitle:
              nullableString(req.body.about_mission_title, "about_mission_title") ?? null,
            aboutMissionBody:
              nullableString(req.body.about_mission_body, "about_mission_body") ?? null,
            aboutWhyChooseTitle:
              nullableString(req.body.about_why_choose_title, "about_why_choose_title") ?? null,
            aboutWhyChoosePoints:
              parseJsonInput(req.body.about_why_choose_points, "about_why_choose_points") ??
              undefined,
            productsSectionTitle:
              nullableString(req.body.products_section_title, "products_section_title") ?? null,
            productsSectionIntro:
              nullableString(req.body.products_section_intro, "products_section_intro") ?? null,
            servicesSectionTitle:
              nullableString(req.body.services_section_title, "services_section_title") ?? null,
            servicesSectionIntro:
              nullableString(req.body.services_section_intro, "services_section_intro") ?? null,
            projectsSectionTitle:
              nullableString(req.body.projects_section_title, "projects_section_title") ?? null,
            projectsSectionIntro:
              nullableString(req.body.projects_section_intro, "projects_section_intro") ?? null,
            testimonialsSectionTitle:
              nullableString(req.body.testimonials_section_title, "testimonials_section_title") ??
              null,
            testimonialsSectionIntro:
              nullableString(req.body.testimonials_section_intro, "testimonials_section_intro") ??
              null,
            customSolutionsTitle:
              nullableString(req.body.custom_solutions_title, "custom_solutions_title") ?? null,
            customSolutionsSubtitle:
              nullableString(req.body.custom_solutions_subtitle, "custom_solutions_subtitle") ??
              null,
            customSolutionsDevelopmentTitle:
              nullableString(
                req.body.custom_solutions_development_title,
                "custom_solutions_development_title",
              ) ?? null,
            customSolutionsDevelopmentBody:
              nullableString(
                req.body.custom_solutions_development_body,
                "custom_solutions_development_body",
              ) ?? null,
            customSolutionsFeatures:
              parseJsonInput(req.body.custom_solutions_features, "custom_solutions_features") ??
              undefined,
            customSolutionsProcessTitle:
              nullableString(
                req.body.custom_solutions_process_title,
                "custom_solutions_process_title",
              ) ?? null,
            customSolutionsProcessSteps:
              parseJsonInput(
                req.body.custom_solutions_process_steps,
                "custom_solutions_process_steps",
              ) ?? undefined,
            customSolutionsCtaLabel:
              nullableString(req.body.custom_solutions_cta_label, "custom_solutions_cta_label") ??
              null,
            customSolutionsCtaUrl:
              nullableString(req.body.custom_solutions_cta_url, "custom_solutions_cta_url") ?? null,
            contactCtaTitle:
              nullableString(req.body.contact_cta_title, "contact_cta_title") ?? null,
            contactCtaBody: nullableString(req.body.contact_cta_body, "contact_cta_body") ?? null,
            contactCtaActions:
              parseJsonInput(req.body.contact_cta_actions, "contact_cta_actions") ?? undefined,
            metaTitle: nullableString(req.body.meta_title, "meta_title") ?? null,
            metaDescription: nullableString(req.body.meta_description, "meta_description") ?? null,
            ogImageAssetId: ogImageAssetId ?? null,
          },
          include: {
            heroVisualAsset: true,
            ogImageAsset: true,
          },
        });

    if (existingPage) {
      await cleanupReplacedMediaAsset(existingPage.heroVisualAssetId, page.heroVisualAssetId);
      await cleanupReplacedMediaAsset(existingPage.ogImageAssetId, page.ogImageAssetId);
    }

    res.json(serializeHomePage(page));
  }),
);

export { homePageRouter };
