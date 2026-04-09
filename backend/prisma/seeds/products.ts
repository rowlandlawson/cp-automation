import type { PrismaClient } from "../../generated/prisma/client";
import { companySeed, productSeed } from "../seed-data";
import { joinFeatureList, toJson } from "./helpers";

export async function seedProducts(prisma: PrismaClient): Promise<number> {
  for (const [index, item] of productSeed.entries()) {
    await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        ctaLabel: item.ctaLabel,
        ctaUrl: item.ctaUrl,
        description: item.description,
        featureList: toJson(item.features),
        features: joinFeatureList(item.features),
        isPublished: true,
        metaDescription: item.metaDescription,
        metaTitle: `${item.name} | ${companySeed.name}`,
        name: item.name,
        orderIndex: index + 1,
      },
      create: {
        ctaLabel: item.ctaLabel,
        ctaUrl: item.ctaUrl,
        description: item.description,
        featureList: toJson(item.features),
        features: joinFeatureList(item.features),
        isPublished: true,
        metaDescription: item.metaDescription,
        metaTitle: `${item.name} | ${companySeed.name}`,
        name: item.name,
        orderIndex: index + 1,
        slug: item.slug,
      },
    });
  }

  return productSeed.length;
}
