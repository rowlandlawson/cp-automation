import type { PrismaClient } from "../../generated/prisma/client";
import { companySeed, projectSeed } from "../seed-data";

export async function seedProjects(
  prisma: PrismaClient,
  projectAssetIds: Map<string, number>,
): Promise<number> {
  for (const [index, item] of projectSeed.entries()) {
    const imageAssetId = projectAssetIds.get(item.publicId);

    await prisma.project.upsert({
      where: { slug: item.slug },
      update: {
        description: item.description,
        imageAssetId: imageAssetId ?? null,
        imagePublicId: item.publicId,
        imageUrl: item.url,
        isPublished: true,
        location: item.location,
        metaDescription: item.metaDescription,
        metaTitle: `${item.title} | ${companySeed.name}`,
        ogImageAssetId: imageAssetId ?? null,
        orderIndex: index + 1,
        title: item.title,
      },
      create: {
        description: item.description,
        imageAssetId: imageAssetId ?? null,
        imagePublicId: item.publicId,
        imageUrl: item.url,
        isPublished: true,
        location: item.location,
        metaDescription: item.metaDescription,
        metaTitle: `${item.title} | ${companySeed.name}`,
        ogImageAssetId: imageAssetId ?? null,
        orderIndex: index + 1,
        slug: item.slug,
        title: item.title,
      },
    });
  }

  return projectSeed.length;
}
