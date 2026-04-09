import type { PrismaClient } from "../../generated/prisma/client";
import { companySeed, siteSettingsSeed } from "../seed-data";
import { toJson } from "./helpers";

export async function seedSiteSettings(
  prisma: PrismaClient,
  assetIds: {
    homeOgId: number;
    logoId: number;
  },
): Promise<number> {
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      address: companySeed.address,
      canonicalBaseUrl: siteSettingsSeed.canonicalBaseUrl,
      companyName: companySeed.name,
      companySummary: siteSettingsSeed.companySummary,
      defaultOgImageAssetId: assetIds.homeOgId,
      email: companySeed.email,
      footerMotto: siteSettingsSeed.footerMotto,
      footerProductLinks: toJson(siteSettingsSeed.footerProductLinks),
      footerQuickLinks: toJson(siteSettingsSeed.footerQuickLinks),
      footerSummary: siteSettingsSeed.footerSummary,
      footerTagline: siteSettingsSeed.footerTagline,
      logoAssetId: assetIds.logoId,
      metaDescription: siteSettingsSeed.metaDescription,
      metaTitle: siteSettingsSeed.metaTitle,
      phone: companySeed.phone,
      siteTagline: siteSettingsSeed.siteTagline,
      socialLinks: toJson(siteSettingsSeed.socialLinks),
      whatsappLink: companySeed.whatsappLink,
      whatsappNumber: companySeed.whatsapp,
    },
    create: {
      address: companySeed.address,
      canonicalBaseUrl: siteSettingsSeed.canonicalBaseUrl,
      companyName: companySeed.name,
      companySummary: siteSettingsSeed.companySummary,
      defaultOgImageAssetId: assetIds.homeOgId,
      email: companySeed.email,
      footerMotto: siteSettingsSeed.footerMotto,
      footerProductLinks: toJson(siteSettingsSeed.footerProductLinks),
      footerQuickLinks: toJson(siteSettingsSeed.footerQuickLinks),
      footerSummary: siteSettingsSeed.footerSummary,
      footerTagline: siteSettingsSeed.footerTagline,
      id: 1,
      logoAssetId: assetIds.logoId,
      metaDescription: siteSettingsSeed.metaDescription,
      metaTitle: siteSettingsSeed.metaTitle,
      phone: companySeed.phone,
      siteTagline: siteSettingsSeed.siteTagline,
      socialLinks: toJson(siteSettingsSeed.socialLinks),
      whatsappLink: companySeed.whatsappLink,
      whatsappNumber: companySeed.whatsapp,
    },
  });

  return 1;
}
