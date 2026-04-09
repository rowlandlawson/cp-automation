import { Router } from "express";

import { asyncHandler } from "../middleware/async-handler";
import { auth } from "../middleware/auth";
import { uploadAboutPortrait } from "../middleware/upload";
import { cleanupReplacedMediaAsset } from "../utils/prisma-cleanup";
import {
  createMediaAssetFromUpload,
  ensureMediaAssetExists,
  resolveMediaAssetId,
} from "../utils/prisma-media";
import { parseJsonInput, requirePrisma } from "../utils/prisma-request";
import { serializeAboutPage } from "../utils/prisma-serializers";
import {
  nullableId,
  nullableString,
  optionalBoolean,
  optionalInteger,
  optionalString,
  requireString,
} from "../utils/request";

const aboutPageRouter = Router();

const ABOUT_UPLOAD_FOLDER = "cp-automation/about";

aboutPageRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const prisma = requirePrisma();
    const page = await prisma.aboutPage.findUnique({
      where: { id: 1 },
      include: {
        ogImageAsset: true,
        portraitAsset: true,
      },
    });

    if (!page) {
      res.status(404).json({ error: "About page content not found." });
      return;
    }

    res.json(serializeAboutPage(page));
  }),
);

aboutPageRouter.put(
  "/",
  auth,
  ...uploadAboutPortrait,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const existingPage = await prisma.aboutPage.findUnique({
      where: { id: 1 },
      include: {
        ogImageAsset: true,
        portraitAsset: true,
      },
    });

    const founderName =
      req.body.founder_name !== undefined
        ? requireString(req.body.founder_name, "founder_name")
        : undefined;
    const portraitAssetInput = nullableId(req.body.portrait_asset_id, "portrait_asset_id");
    const ogImageAssetId = await resolveMediaAssetId(
      nullableId(req.body.og_image_asset_id, "og_image_asset_id"),
      "og_image_asset_id",
    );
    const uploadedPortrait = req.uploadedImage
      ? await createMediaAssetFromUpload({
          altText:
            nullableString(req.body.portrait_alt_text, "portrait_alt_text") ??
            founderName ??
            existingPage?.founderName ??
            "Founder portrait",
          folder: ABOUT_UPLOAD_FOLDER,
          title:
            nullableString(req.body.portrait_title, "portrait_title") ??
            founderName ??
            existingPage?.founderName ??
            "Founder portrait",
          uploadedById: req.userId ?? null,
          upload: req.uploadedImage,
        })
      : null;

    let portraitAssetId: number | null | undefined;
    if (uploadedPortrait) {
      portraitAssetId = uploadedPortrait.id;
    } else if (portraitAssetInput !== undefined) {
      if (portraitAssetInput === null) {
        portraitAssetId = null;
      } else {
        const portraitAsset = await ensureMediaAssetExists(portraitAssetInput, "portrait_asset_id");
        portraitAssetId = portraitAsset.id;
      }
    }

    const page = existingPage
      ? await prisma.aboutPage.update({
          where: { id: 1 },
          data: {
            slug: optionalString(req.body.slug, "slug"),
            isPublished: optionalBoolean(req.body.is_published, "is_published"),
            pageTitle: nullableString(req.body.page_title, "page_title"),
            pageSubtitle: nullableString(req.body.page_subtitle, "page_subtitle"),
            founderName,
            founderRole: nullableString(req.body.founder_role, "founder_role"),
            portraitAssetId,
            shortBio: nullableString(req.body.short_bio, "short_bio"),
            longStory: nullableString(req.body.long_story, "long_story"),
            mission: nullableString(req.body.mission, "mission"),
            vision: nullableString(req.body.vision, "vision"),
            values: parseJsonInput(req.body.values, "values"),
            certifications: parseJsonInput(req.body.certifications, "certifications"),
            yearsOfExperience: optionalInteger(req.body.years_of_experience, "years_of_experience"),
            stats: parseJsonInput(req.body.stats, "stats"),
            serviceLocations: parseJsonInput(req.body.service_locations, "service_locations"),
            credibilityPoints: parseJsonInput(req.body.credibility_points, "credibility_points"),
            primaryCtaLabel: nullableString(req.body.primary_cta_label, "primary_cta_label"),
            primaryCtaUrl: nullableString(req.body.primary_cta_url, "primary_cta_url"),
            metaTitle: nullableString(req.body.meta_title, "meta_title"),
            metaDescription: nullableString(req.body.meta_description, "meta_description"),
            ogImageAssetId,
          },
          include: {
            ogImageAsset: true,
            portraitAsset: true,
          },
        })
      : await prisma.aboutPage.create({
          data: {
            slug: optionalString(req.body.slug, "slug") ?? "about",
            isPublished: optionalBoolean(req.body.is_published, "is_published") ?? true,
            pageTitle: nullableString(req.body.page_title, "page_title") ?? null,
            pageSubtitle: nullableString(req.body.page_subtitle, "page_subtitle") ?? null,
            founderName: founderName ?? requireString(req.body.founder_name, "founder_name"),
            founderRole: nullableString(req.body.founder_role, "founder_role") ?? null,
            portraitAssetId: portraitAssetId ?? null,
            shortBio: nullableString(req.body.short_bio, "short_bio") ?? null,
            longStory: nullableString(req.body.long_story, "long_story") ?? null,
            mission: nullableString(req.body.mission, "mission") ?? null,
            vision: nullableString(req.body.vision, "vision") ?? null,
            values: parseJsonInput(req.body.values, "values") ?? undefined,
            certifications: parseJsonInput(req.body.certifications, "certifications") ?? undefined,
            yearsOfExperience:
              optionalInteger(req.body.years_of_experience, "years_of_experience") ?? null,
            stats: parseJsonInput(req.body.stats, "stats") ?? undefined,
            serviceLocations:
              parseJsonInput(req.body.service_locations, "service_locations") ?? undefined,
            credibilityPoints:
              parseJsonInput(req.body.credibility_points, "credibility_points") ?? undefined,
            primaryCtaLabel:
              nullableString(req.body.primary_cta_label, "primary_cta_label") ?? null,
            primaryCtaUrl: nullableString(req.body.primary_cta_url, "primary_cta_url") ?? null,
            metaTitle: nullableString(req.body.meta_title, "meta_title") ?? null,
            metaDescription: nullableString(req.body.meta_description, "meta_description") ?? null,
            ogImageAssetId: ogImageAssetId ?? null,
          },
          include: {
            ogImageAsset: true,
            portraitAsset: true,
          },
        });

    if (existingPage) {
      await cleanupReplacedMediaAsset(existingPage.portraitAssetId, page.portraitAssetId);
      await cleanupReplacedMediaAsset(existingPage.ogImageAssetId, page.ogImageAssetId);
    }

    res.json(serializeAboutPage(page));
  }),
);

export { aboutPageRouter };
