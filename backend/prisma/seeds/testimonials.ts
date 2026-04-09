import type { PrismaClient } from "../../generated/prisma/client";
import { testimonialSeed } from "../seed-data";

export async function seedTestimonials(prisma: PrismaClient): Promise<number> {
  for (const [index, item] of testimonialSeed.entries()) {
    await prisma.testimonial.upsert({
      where: { id: item.id },
      update: {
        author: item.author,
        authorRole: item.authorRole,
        companyName: item.companyName,
        isFeatured: item.isFeatured,
        isPublished: true,
        location: item.location,
        orderIndex: index + 1,
        quote: item.quote,
        rating: item.rating,
        sourceUrl: item.sourceUrl,
      },
      create: {
        author: item.author,
        authorRole: item.authorRole,
        companyName: item.companyName,
        id: item.id,
        isFeatured: item.isFeatured,
        isPublished: true,
        location: item.location,
        orderIndex: index + 1,
        quote: item.quote,
        rating: item.rating,
        sourceUrl: item.sourceUrl,
      },
    });
  }

  return testimonialSeed.length;
}
