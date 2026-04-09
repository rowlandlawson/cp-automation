import type { PrismaClient } from "../../generated/prisma/client";
import { mediaAssetSeed } from "../seed-data";
import { upsertMediaAsset } from "./helpers";

export type SeededMediaAssets = {
  count: number;
  homeOgId: number;
  logoId: number;
  portraitId: number;
  projectAssetIds: Map<string, number>;
};

export async function seedMediaAssets(
  prisma: PrismaClient,
  uploadedById: number,
): Promise<SeededMediaAssets> {
  const logoId = await upsertMediaAsset(prisma, {
    ...mediaAssetSeed.logo,
    uploadedById,
  });
  const homeOgId = await upsertMediaAsset(prisma, {
    ...mediaAssetSeed.homeOg,
    uploadedById,
  });
  const portraitId = await upsertMediaAsset(prisma, {
    ...mediaAssetSeed.aboutPortrait,
    uploadedById,
  });

  const projectAssetIds = new Map<string, number>();
  for (const asset of mediaAssetSeed.projects) {
    const assetId = await upsertMediaAsset(prisma, {
      ...asset,
      uploadedById,
    });
    projectAssetIds.set(asset.publicId, assetId);
  }

  return {
    count: mediaAssetSeed.projects.length + 3,
    homeOgId,
    logoId,
    portraitId,
    projectAssetIds,
  };
}
