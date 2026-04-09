import "dotenv/config";

import { prisma } from "../config/prisma";
import { testDatabaseConnections } from "../config/database";
import { adminSeed } from "../prisma/seed-data";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main(): Promise<void> {
  assert(prisma, "Prisma client is not configured.");

  const adminUsername = adminSeed.username;
  const adminEmail = adminSeed.email;

  const database = await testDatabaseConnections();
  if (database.pg.state !== "connected" || database.prisma.state !== "connected") {
    throw new Error(
      `Database is not ready. pg=${database.pg.state} prisma=${database.prisma.state}`,
    );
  }

  const [
    adminUser,
    siteSettings,
    homePage,
    aboutPage,
    productCount,
    serviceCount,
    projectCount,
    testimonialCount,
    mediaAssetCount,
    pageSectionCount,
    contentSectionCount,
  ] = await Promise.all([
    prisma.user.findFirst({
      where: {
        OR: [{ username: adminUsername }, { email: adminEmail }],
      },
      select: {
        email: true,
        id: true,
        isActive: true,
        role: true,
        username: true,
      },
    }),
    prisma.siteSettings.findUnique({ where: { id: 1 }, select: { id: true } }),
    prisma.homePage.findUnique({ where: { id: 1 }, select: { id: true } }),
    prisma.aboutPage.findUnique({ where: { id: 1 }, select: { id: true } }),
    prisma.product.count(),
    prisma.service.count(),
    prisma.project.count(),
    prisma.testimonial.count(),
    prisma.mediaAsset.count(),
    prisma.pageSection.count(),
    prisma.contentSection.count(),
  ]);

  const summary = {
    admin_user: adminUser,
    counts: {
      content_sections: contentSectionCount,
      media_assets: mediaAssetCount,
      page_sections: pageSectionCount,
      products: productCount,
      projects: projectCount,
      services: serviceCount,
      testimonials: testimonialCount,
    },
    database,
    singletons: {
      about_page: Boolean(aboutPage),
      home_page: Boolean(homePage),
      site_settings: Boolean(siteSettings),
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  assert(adminUser, "Seeded admin user was not found.");
  assert(adminUser.isActive, "Seeded admin user is inactive.");
  assert(siteSettings, "Seeded site settings record was not found.");
  assert(homePage, "Seeded home page record was not found.");
  assert(aboutPage, "Seeded about page record was not found.");
  assert(productCount > 0, "No seeded products were found.");
  assert(serviceCount > 0, "No seeded services were found.");
  assert(projectCount > 0, "No seeded projects were found.");
  assert(testimonialCount > 0, "No seeded testimonials were found.");
  assert(mediaAssetCount > 0, "No seeded media assets were found.");
  assert(pageSectionCount > 0, "No seeded page sections were found.");
  assert(contentSectionCount > 0, "No seeded legacy content sections were found.");
}

main()
  .catch((error) => {
    console.error(`[verify:seed] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
