import { Router } from "express";

import { asyncHandler } from "../middleware/async-handler";
import { auth } from "../middleware/auth";
import { cleanupReplacedMediaAsset } from "../utils/prisma-cleanup";
import { resolveMediaAssetId } from "../utils/prisma-media";
import { parseJsonInput, requirePrisma } from "../utils/prisma-request";
import { serializeSiteSettings } from "../utils/prisma-serializers";
import { nullableId, nullableString, requireString } from "../utils/request";

const siteSettingsRouter = Router();

siteSettingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const prisma = requirePrisma();
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      include: {
        defaultOgImageAsset: true,
        logoAsset: true,
      },
    });

    if (!settings) {
      res.status(404).json({ error: "Site settings not found." });
      return;
    }

    res.json(serializeSiteSettings(settings));
  }),
);

siteSettingsRouter.put(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const existingSettings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      include: {
        defaultOgImageAsset: true,
        logoAsset: true,
      },
    });

    const companyName =
      req.body.company_name !== undefined
        ? requireString(req.body.company_name, "company_name")
        : undefined;
    const logoAssetId = await resolveMediaAssetId(
      nullableId(req.body.logo_asset_id, "logo_asset_id"),
      "logo_asset_id",
    );
    const defaultOgImageAssetId = await resolveMediaAssetId(
      nullableId(req.body.default_og_image_asset_id, "default_og_image_asset_id"),
      "default_og_image_asset_id",
    );

    const settings = existingSettings
      ? await prisma.siteSettings.update({
          where: { id: 1 },
          data: {
            companyName,
            siteTagline: nullableString(req.body.site_tagline, "site_tagline"),
            companySummary: nullableString(req.body.company_summary, "company_summary"),
            phone: nullableString(req.body.phone, "phone"),
            whatsappNumber: nullableString(req.body.whatsapp_number, "whatsapp_number"),
            whatsappLink: nullableString(req.body.whatsapp_link, "whatsapp_link"),
            email: nullableString(req.body.email, "email"),
            address: nullableString(req.body.address, "address"),
            socialLinks: parseJsonInput(req.body.social_links, "social_links"),
            footerMotto: nullableString(req.body.footer_motto, "footer_motto"),
            footerTagline: nullableString(req.body.footer_tagline, "footer_tagline"),
            footerSummary: nullableString(req.body.footer_summary, "footer_summary"),
            footerQuickLinks: parseJsonInput(req.body.footer_quick_links, "footer_quick_links"),
            footerProductLinks: parseJsonInput(
              req.body.footer_product_links,
              "footer_product_links",
            ),
            logoAssetId,
            defaultOgImageAssetId,
            metaTitle: nullableString(req.body.meta_title, "meta_title"),
            metaDescription: nullableString(req.body.meta_description, "meta_description"),
            canonicalBaseUrl: nullableString(req.body.canonical_base_url, "canonical_base_url"),
          },
          include: {
            defaultOgImageAsset: true,
            logoAsset: true,
          },
        })
      : await prisma.siteSettings.create({
          data: {
            companyName: companyName ?? requireString(req.body.company_name, "company_name"),
            siteTagline: nullableString(req.body.site_tagline, "site_tagline") ?? null,
            companySummary: nullableString(req.body.company_summary, "company_summary") ?? null,
            phone: nullableString(req.body.phone, "phone") ?? null,
            whatsappNumber: nullableString(req.body.whatsapp_number, "whatsapp_number") ?? null,
            whatsappLink: nullableString(req.body.whatsapp_link, "whatsapp_link") ?? null,
            email: nullableString(req.body.email, "email") ?? null,
            address: nullableString(req.body.address, "address") ?? null,
            socialLinks: parseJsonInput(req.body.social_links, "social_links") ?? undefined,
            footerMotto: nullableString(req.body.footer_motto, "footer_motto") ?? null,
            footerTagline: nullableString(req.body.footer_tagline, "footer_tagline") ?? null,
            footerSummary: nullableString(req.body.footer_summary, "footer_summary") ?? null,
            footerQuickLinks:
              parseJsonInput(req.body.footer_quick_links, "footer_quick_links") ?? undefined,
            footerProductLinks:
              parseJsonInput(req.body.footer_product_links, "footer_product_links") ?? undefined,
            logoAssetId: logoAssetId ?? null,
            defaultOgImageAssetId: defaultOgImageAssetId ?? null,
            metaTitle: nullableString(req.body.meta_title, "meta_title") ?? null,
            metaDescription: nullableString(req.body.meta_description, "meta_description") ?? null,
            canonicalBaseUrl:
              nullableString(req.body.canonical_base_url, "canonical_base_url") ?? null,
          },
          include: {
            defaultOgImageAsset: true,
            logoAsset: true,
          },
        });

    if (existingSettings) {
      await cleanupReplacedMediaAsset(existingSettings.logoAssetId, settings.logoAssetId);
      await cleanupReplacedMediaAsset(
        existingSettings.defaultOgImageAssetId,
        settings.defaultOgImageAssetId,
      );
    }

    res.json(serializeSiteSettings(settings));
  }),
);

export { siteSettingsRouter };
