import type { PrismaClient } from "../../generated/prisma/client";
import { companySeed, serviceSeed } from "../seed-data";
import { toJson } from "./helpers";

export async function seedServices(prisma: PrismaClient): Promise<number> {
  for (const [index, item] of serviceSeed.entries()) {
    await prisma.service.upsert({
      where: { slug: item.slug },
      update: {
        ctaLabel: "Talk to Us",
        ctaUrl: companySeed.whatsappLink,
        description: item.description,
        highlightList: toJson(item.highlights),
        iconName: item.iconName,
        isPublished: true,
        metaDescription: item.metaDescription,
        metaTitle: `${item.name} | ${companySeed.name}`,
        name: item.name,
        orderIndex: index + 1,
      },
      create: {
        ctaLabel: "Talk to Us",
        ctaUrl: companySeed.whatsappLink,
        description: item.description,
        highlightList: toJson(item.highlights),
        iconName: item.iconName,
        isPublished: true,
        metaDescription: item.metaDescription,
        metaTitle: `${item.name} | ${companySeed.name}`,
        name: item.name,
        orderIndex: index + 1,
        slug: item.slug,
      },
    });
  }

  return serviceSeed.length;
}
