import type { PrismaClient } from "../../generated/prisma/client";
import { aboutPageSeed } from "../seed-data";
import { toJson } from "./helpers";

export async function seedAboutPage(
  prisma: PrismaClient,
  assetIds: {
    homeOgId: number;
    portraitId: number;
  },
): Promise<number> {
  await prisma.aboutPage.upsert({
    where: { id: 1 },
    update: {
      certifications: toJson(aboutPageSeed.certifications),
      credibilityPoints: toJson(aboutPageSeed.credibilityPoints),
      founderName: aboutPageSeed.founderName,
      founderRole: aboutPageSeed.founderRole,
      longStory: aboutPageSeed.longStory,
      metaDescription: aboutPageSeed.metaDescription,
      metaTitle: aboutPageSeed.metaTitle,
      mission: aboutPageSeed.mission,
      ogImageAssetId: assetIds.homeOgId,
      pageSubtitle: aboutPageSeed.pageSubtitle,
      pageTitle: aboutPageSeed.pageTitle,
      portraitAssetId: assetIds.portraitId,
      primaryCtaLabel: aboutPageSeed.primaryCtaLabel,
      primaryCtaUrl: aboutPageSeed.primaryCtaUrl,
      serviceLocations: toJson(aboutPageSeed.serviceLocations),
      shortBio: aboutPageSeed.shortBio,
      stats: toJson(aboutPageSeed.stats),
      values: toJson(aboutPageSeed.values),
      vision: aboutPageSeed.vision,
      yearsOfExperience: aboutPageSeed.yearsOfExperience,
    },
    create: {
      certifications: toJson(aboutPageSeed.certifications),
      credibilityPoints: toJson(aboutPageSeed.credibilityPoints),
      founderName: aboutPageSeed.founderName,
      founderRole: aboutPageSeed.founderRole,
      id: 1,
      longStory: aboutPageSeed.longStory,
      metaDescription: aboutPageSeed.metaDescription,
      metaTitle: aboutPageSeed.metaTitle,
      mission: aboutPageSeed.mission,
      ogImageAssetId: assetIds.homeOgId,
      pageSubtitle: aboutPageSeed.pageSubtitle,
      pageTitle: aboutPageSeed.pageTitle,
      portraitAssetId: assetIds.portraitId,
      primaryCtaLabel: aboutPageSeed.primaryCtaLabel,
      primaryCtaUrl: aboutPageSeed.primaryCtaUrl,
      serviceLocations: toJson(aboutPageSeed.serviceLocations),
      shortBio: aboutPageSeed.shortBio,
      stats: toJson(aboutPageSeed.stats),
      values: toJson(aboutPageSeed.values),
      vision: aboutPageSeed.vision,
      yearsOfExperience: aboutPageSeed.yearsOfExperience,
    },
  });

  return 1;
}
