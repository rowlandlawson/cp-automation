import { query } from "../config/db";
import { prisma } from "../config/prisma";

async function assertTableExists(tableName: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [tableName],
  );

  return Boolean(result.rows[0]?.exists);
}

async function main(): Promise<void> {
  if (!prisma) {
    throw new Error("Prisma client is not configured.");
  }

  const [mediaAssetsTable, siteSettingsTable, homePagesTable, aboutPagesTable, pageSectionsTable] =
    await Promise.all([
      assertTableExists("media_assets"),
      assertTableExists("site_settings"),
      assertTableExists("home_pages"),
      assertTableExists("about_pages"),
      assertTableExists("page_sections"),
    ]);

  const [siteSettings, homePage, aboutPage, mediaAssetCount, pageSectionCount] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 1 }, select: { id: true } }),
    prisma.homePage.findUnique({ where: { id: 1 }, select: { id: true } }),
    prisma.aboutPage.findUnique({ where: { id: 1 }, select: { id: true } }),
    prisma.mediaAsset.count(),
    prisma.pageSection.count(),
  ]);

  const summary = {
    aboutPageSeeded: Boolean(aboutPage),
    counts: {
      mediaAssets: mediaAssetCount,
      pageSections: pageSectionCount,
    },
    homePageSeeded: Boolean(homePage),
    siteSettingsSeeded: Boolean(siteSettings),
    tables: {
      about_pages: aboutPagesTable,
      home_pages: homePagesTable,
      media_assets: mediaAssetsTable,
      page_sections: pageSectionsTable,
      site_settings: siteSettingsTable,
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  if (
    !mediaAssetsTable ||
    !siteSettingsTable ||
    !homePagesTable ||
    !aboutPagesTable ||
    !pageSectionsTable ||
    !siteSettings ||
    !homePage ||
    !aboutPage
  ) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Prisma migration verification failed.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
