import type { PrismaClient } from "../../generated/prisma/client";
import { pageSectionSeed } from "../seed-data";
import { toJson } from "./helpers";

export async function seedPageSections(prisma: PrismaClient): Promise<number> {
  for (const [index, item] of pageSectionSeed.entries()) {
    const body = "body" in item && typeof item.body === "string" ? item.body : null;
    const ctaLabel = "ctaLabel" in item && typeof item.ctaLabel === "string" ? item.ctaLabel : null;
    const ctaUrl = "ctaUrl" in item && typeof item.ctaUrl === "string" ? item.ctaUrl : null;
    const subtitle = "subtitle" in item && typeof item.subtitle === "string" ? item.subtitle : null;

    await prisma.pageSection.upsert({
      where: {
        pageType_sectionKey: {
          pageType: item.pageType,
          sectionKey: item.sectionKey,
        },
      },
      update: {
        body,
        ctaLabel,
        ctaUrl,
        content: item.content ? toJson(item.content) : undefined,
        isPublished: true,
        orderIndex: index + 1,
        subtitle,
        title: item.title ?? null,
      },
      create: {
        body,
        ctaLabel,
        ctaUrl,
        content: item.content ? toJson(item.content) : undefined,
        isPublished: true,
        orderIndex: index + 1,
        pageType: item.pageType,
        sectionKey: item.sectionKey,
        subtitle,
        title: item.title ?? null,
      },
    });
  }

  return pageSectionSeed.length;
}
