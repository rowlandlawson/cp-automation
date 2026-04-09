import type { PrismaClient } from "../../generated/prisma/client";
import { contentSectionSeed } from "../seed-data";

export async function seedLegacyContentSections(
  prisma: PrismaClient,
  userId: number,
): Promise<number> {
  for (const item of contentSectionSeed) {
    await prisma.contentSection.upsert({
      where: { sectionName: item.sectionName },
      update: {
        content: item.content,
        updatedBy: userId,
      },
      create: {
        content: item.content,
        sectionName: item.sectionName,
        updatedBy: userId,
      },
    });
  }

  return contentSectionSeed.length;
}
