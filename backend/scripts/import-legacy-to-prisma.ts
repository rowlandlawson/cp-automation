import path from "node:path";

import { query } from "../config/db";
import { prisma } from "../config/prisma";

type InventoryProduct = {
  ctaLabel?: string;
  ctaUrl?: string;
  description?: string;
  features?: string[];
  name: string;
};

type InventoryProject = {
  description?: string;
  image?: string;
  location?: string;
  responsiveImage?: string;
  title: string;
};

type InventoryService = {
  description?: string;
  name: string;
};

type InventoryTestimonial = {
  author?: string | null;
  location?: string | null;
  quote: string;
  rating?: number;
};

type InventoryShape = {
  company?: {
    address?: string;
    email?: string;
    name?: string;
    phone?: string;
    whatsapp?: string;
    whatsappLink?: string;
  };
  footer?: {
    companySummary?: string;
    motto?: string;
    productLinks?: string[];
    quickLinks?: string[];
    socialLinks?: Array<{ platform: string; url: string }>;
    tagline?: string;
  };
  home?: {
    aboutSummary?: {
      missionCard?: { body?: string; title?: string };
      subtitle?: string;
      title?: string;
      whyChooseUsCard?: { points?: string[]; title?: string };
    };
    contactCta?: {
      actions?: Array<{ label: string; url: string }>;
      body?: string;
      title?: string;
    };
    customSolutions?: {
      developmentCard?: { body?: string; points?: string[]; title?: string };
      processCard?: {
        cta?: { label?: string; url?: string };
        steps?: Array<{ body?: string; step?: number; title?: string }>;
        title?: string;
      };
      subtitle?: string;
      title?: string;
    };
    hero?: {
      body?: string;
      primaryCta?: { label?: string; url?: string };
      secondaryCta?: { label?: string; url?: string };
      stats?: Array<{ label: string; value: number }>;
      title?: string;
    };
    productsSection?: { subtitle?: string; title?: string };
    projectsSection?: { subtitle?: string; title?: string };
    servicesSection?: { subtitle?: string; title?: string };
    testimonialsSection?: { subtitle?: string; title?: string };
  };
  mediaInventory?: {
    unused?: string[];
    used?: string[];
  };
  products?: InventoryProduct[];
  projects?: InventoryProject[];
  services?: InventoryService[];
  testimonials?: InventoryTestimonial[];
};

type LegacyProjectRow = {
  description: string | null;
  id: number;
  image_public_id: string | null;
  image_url: string | null;
  location: string | null;
  title: string;
};

type LegacyProductRow = {
  description: string | null;
  features: string | null;
  id: number;
  name: string;
};

type LegacyServiceRow = {
  description: string | null;
  icon_name: string | null;
  id: number;
  name: string;
};

type LegacyTestimonialRow = {
  author: string | null;
  id: number;
  location: string | null;
  quote: string;
  rating: number | null;
};

type LegacyContentSectionRow = {
  content: string | null;
  section_name: string;
};

type LegacyUserRow = {
  id: number;
  is_active: boolean;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function splitFeatureText(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n|,|;/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function cleanNullableString(value: string | null | undefined): string | null {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

function buildMetaDescription(...candidates: Array<string | null | undefined>): string | null {
  const joined = candidates
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!joined) {
    return null;
  }

  return joined.slice(0, 320);
}

async function loadInventory(): Promise<InventoryShape> {
  const inventoryPath = path.resolve(import.meta.dir, "../../docs/phase-0-content-inventory.json");

  return (await Bun.file(inventoryPath).json()) as InventoryShape;
}

async function getPrimaryAdminUserId(): Promise<number | null> {
  const result = await query<LegacyUserRow>(
    `
      SELECT id, is_active
      FROM users
      WHERE is_active = true
      ORDER BY created_at ASC
      LIMIT 1
    `,
  );

  return result.rows[0]?.id ?? null;
}

async function findOrCreateMediaAsset(input: {
  altText?: string | null;
  folder?: string | null;
  publicId?: string | null;
  title?: string | null;
  uploadedById?: number | null;
  url: string;
}): Promise<number> {
  const normalizedUrl = input.url.trim();
  const normalizedPublicId = cleanNullableString(input.publicId);

  if (normalizedPublicId) {
    const existingByPublicId = await prisma?.mediaAsset.findUnique({
      where: { publicId: normalizedPublicId },
      select: { id: true },
    });

    if (existingByPublicId) {
      return existingByPublicId.id;
    }
  }

  const existingByUrl = await prisma?.mediaAsset.findFirst({
    where: { url: normalizedUrl },
    select: { id: true },
  });

  if (existingByUrl) {
    return existingByUrl.id;
  }

  const asset = await prisma!.mediaAsset.create({
    data: {
      altText: cleanNullableString(input.altText),
      fileName: path.basename(normalizedUrl),
      folder: cleanNullableString(input.folder) ?? "legacy/imported",
      publicId: normalizedPublicId,
      secureUrl: normalizedUrl.startsWith("http") ? normalizedUrl : null,
      title: cleanNullableString(input.title),
      uploadedById: input.uploadedById ?? null,
      url: normalizedUrl,
    },
    select: { id: true },
  });

  return asset.id;
}

async function importSiteSettings(
  inventory: InventoryShape,
  uploadedById: number | null,
): Promise<void> {
  const logoPath = inventory.mediaInventory?.used?.find((item) =>
    item.toLowerCase().includes("logo."),
  );

  const logoAssetId = logoPath
    ? await findOrCreateMediaAsset({
        altText: `${inventory.company?.name ?? "CP Automation"} logo`,
        folder: "legacy/site",
        title: "Company Logo",
        uploadedById,
        url: logoPath,
      })
    : null;

  await prisma!.siteSettings.upsert({
    where: { id: 1 },
    update: {
      address: cleanNullableString(inventory.company?.address),
      canonicalBaseUrl: "http://localhost:3000",
      companyName: inventory.company?.name ?? "CP Automation",
      companySummary: cleanNullableString(inventory.footer?.companySummary),
      defaultOgImageAssetId: logoAssetId,
      email: cleanNullableString(inventory.company?.email),
      footerMotto: cleanNullableString(inventory.footer?.motto),
      footerProductLinks: inventory.footer?.productLinks ?? [],
      footerQuickLinks: inventory.footer?.quickLinks ?? [],
      footerSummary: cleanNullableString(inventory.footer?.companySummary),
      footerTagline: cleanNullableString(inventory.footer?.tagline),
      logoAssetId,
      metaDescription: buildMetaDescription(
        inventory.footer?.tagline,
        inventory.footer?.companySummary,
      ),
      metaTitle: inventory.company?.name
        ? `${inventory.company.name} | Life Made Easy`
        : "CP Automation | Life Made Easy",
      phone: cleanNullableString(inventory.company?.phone),
      siteTagline: cleanNullableString(inventory.footer?.tagline),
      socialLinks: inventory.footer?.socialLinks ?? [],
      whatsappLink: cleanNullableString(inventory.company?.whatsappLink),
      whatsappNumber: cleanNullableString(inventory.company?.whatsapp),
    },
    create: {
      address: cleanNullableString(inventory.company?.address),
      canonicalBaseUrl: "http://localhost:3000",
      companyName: inventory.company?.name ?? "CP Automation",
      companySummary: cleanNullableString(inventory.footer?.companySummary),
      defaultOgImageAssetId: logoAssetId,
      email: cleanNullableString(inventory.company?.email),
      footerMotto: cleanNullableString(inventory.footer?.motto),
      footerProductLinks: inventory.footer?.productLinks ?? [],
      footerQuickLinks: inventory.footer?.quickLinks ?? [],
      footerSummary: cleanNullableString(inventory.footer?.companySummary),
      footerTagline: cleanNullableString(inventory.footer?.tagline),
      id: 1,
      logoAssetId,
      metaDescription: buildMetaDescription(
        inventory.footer?.tagline,
        inventory.footer?.companySummary,
      ),
      metaTitle: inventory.company?.name
        ? `${inventory.company.name} | Life Made Easy`
        : "CP Automation | Life Made Easy",
      phone: cleanNullableString(inventory.company?.phone),
      siteTagline: cleanNullableString(inventory.footer?.tagline),
      socialLinks: inventory.footer?.socialLinks ?? [],
      whatsappLink: cleanNullableString(inventory.company?.whatsappLink),
      whatsappNumber: cleanNullableString(inventory.company?.whatsapp),
    },
  });
}

async function importHomePage(inventory: InventoryShape): Promise<void> {
  const hero = inventory.home?.hero;
  const aboutSummary = inventory.home?.aboutSummary;
  const customSolutions = inventory.home?.customSolutions;
  const contactCta = inventory.home?.contactCta;

  await prisma!.homePage.upsert({
    where: { id: 1 },
    update: {
      aboutMissionBody: cleanNullableString(aboutSummary?.missionCard?.body),
      aboutMissionTitle: cleanNullableString(aboutSummary?.missionCard?.title),
      aboutSummarySubtitle: cleanNullableString(aboutSummary?.subtitle),
      aboutSummaryTitle: cleanNullableString(aboutSummary?.title),
      aboutWhyChoosePoints: aboutSummary?.whyChooseUsCard?.points ?? [],
      aboutWhyChooseTitle: cleanNullableString(aboutSummary?.whyChooseUsCard?.title),
      contactCtaActions: contactCta?.actions ?? [],
      contactCtaBody: cleanNullableString(contactCta?.body),
      contactCtaTitle: cleanNullableString(contactCta?.title),
      customSolutionsCtaLabel: cleanNullableString(customSolutions?.processCard?.cta?.label),
      customSolutionsCtaUrl: cleanNullableString(customSolutions?.processCard?.cta?.url),
      customSolutionsDevelopmentBody: cleanNullableString(customSolutions?.developmentCard?.body),
      customSolutionsDevelopmentTitle: cleanNullableString(customSolutions?.developmentCard?.title),
      customSolutionsFeatures: customSolutions?.developmentCard?.points ?? [],
      customSolutionsProcessSteps: customSolutions?.processCard?.steps ?? [],
      customSolutionsProcessTitle: cleanNullableString(customSolutions?.processCard?.title),
      customSolutionsSubtitle: cleanNullableString(customSolutions?.subtitle),
      customSolutionsTitle: cleanNullableString(customSolutions?.title),
      heroHeading: hero?.title ?? "Life Made Easy With CP Automation",
      heroPrimaryCtaLabel: cleanNullableString(hero?.primaryCta?.label),
      heroPrimaryCtaUrl: cleanNullableString(hero?.primaryCta?.url),
      heroSecondaryCtaLabel: cleanNullableString(hero?.secondaryCta?.label),
      heroSecondaryCtaUrl: cleanNullableString(hero?.secondaryCta?.url),
      heroStats: hero?.stats ?? [],
      heroSubheading: cleanNullableString(hero?.body),
      metaDescription: buildMetaDescription(hero?.body),
      metaTitle: hero?.title
        ? `${hero.title} | ${inventory.company?.name ?? "CP Automation"}`
        : `${inventory.company?.name ?? "CP Automation"} | Home`,
      productsSectionTitle: cleanNullableString(inventory.home?.productsSection?.title),
      productsSectionIntro: cleanNullableString(inventory.home?.productsSection?.subtitle),
      projectsSectionTitle: cleanNullableString(inventory.home?.projectsSection?.title),
      projectsSectionIntro: cleanNullableString(inventory.home?.projectsSection?.subtitle),
      servicesSectionTitle: cleanNullableString(inventory.home?.servicesSection?.title),
      servicesSectionIntro: cleanNullableString(inventory.home?.servicesSection?.subtitle),
      testimonialsSectionTitle: cleanNullableString(inventory.home?.testimonialsSection?.title),
      testimonialsSectionIntro: cleanNullableString(inventory.home?.testimonialsSection?.subtitle),
    },
    create: {
      aboutMissionBody: cleanNullableString(aboutSummary?.missionCard?.body),
      aboutMissionTitle: cleanNullableString(aboutSummary?.missionCard?.title),
      aboutSummarySubtitle: cleanNullableString(aboutSummary?.subtitle),
      aboutSummaryTitle: cleanNullableString(aboutSummary?.title),
      aboutWhyChoosePoints: aboutSummary?.whyChooseUsCard?.points ?? [],
      aboutWhyChooseTitle: cleanNullableString(aboutSummary?.whyChooseUsCard?.title),
      contactCtaActions: contactCta?.actions ?? [],
      contactCtaBody: cleanNullableString(contactCta?.body),
      contactCtaTitle: cleanNullableString(contactCta?.title),
      customSolutionsCtaLabel: cleanNullableString(customSolutions?.processCard?.cta?.label),
      customSolutionsCtaUrl: cleanNullableString(customSolutions?.processCard?.cta?.url),
      customSolutionsDevelopmentBody: cleanNullableString(customSolutions?.developmentCard?.body),
      customSolutionsDevelopmentTitle: cleanNullableString(customSolutions?.developmentCard?.title),
      customSolutionsFeatures: customSolutions?.developmentCard?.points ?? [],
      customSolutionsProcessSteps: customSolutions?.processCard?.steps ?? [],
      customSolutionsProcessTitle: cleanNullableString(customSolutions?.processCard?.title),
      customSolutionsSubtitle: cleanNullableString(customSolutions?.subtitle),
      customSolutionsTitle: cleanNullableString(customSolutions?.title),
      heroHeading: hero?.title ?? "Life Made Easy With CP Automation",
      heroPrimaryCtaLabel: cleanNullableString(hero?.primaryCta?.label),
      heroPrimaryCtaUrl: cleanNullableString(hero?.primaryCta?.url),
      heroSecondaryCtaLabel: cleanNullableString(hero?.secondaryCta?.label),
      heroSecondaryCtaUrl: cleanNullableString(hero?.secondaryCta?.url),
      heroStats: hero?.stats ?? [],
      heroSubheading: cleanNullableString(hero?.body),
      id: 1,
      metaDescription: buildMetaDescription(hero?.body),
      metaTitle: hero?.title
        ? `${hero.title} | ${inventory.company?.name ?? "CP Automation"}`
        : `${inventory.company?.name ?? "CP Automation"} | Home`,
      productsSectionTitle: cleanNullableString(inventory.home?.productsSection?.title),
      productsSectionIntro: cleanNullableString(inventory.home?.productsSection?.subtitle),
      projectsSectionTitle: cleanNullableString(inventory.home?.projectsSection?.title),
      projectsSectionIntro: cleanNullableString(inventory.home?.projectsSection?.subtitle),
      servicesSectionTitle: cleanNullableString(inventory.home?.servicesSection?.title),
      servicesSectionIntro: cleanNullableString(inventory.home?.servicesSection?.subtitle),
      testimonialsSectionTitle: cleanNullableString(inventory.home?.testimonialsSection?.title),
      testimonialsSectionIntro: cleanNullableString(inventory.home?.testimonialsSection?.subtitle),
    },
  });
}

async function importAboutPage(inventory: InventoryShape): Promise<void> {
  const stats = inventory.home?.hero?.stats ?? [];
  const whyChoosePoints = inventory.home?.aboutSummary?.whyChooseUsCard?.points ?? [];
  const locations = Array.from(
    new Set(
      (inventory.projects ?? [])
        .map((project) => project.location?.trim())
        .filter(Boolean) as string[],
    ),
  );

  await prisma!.aboutPage.upsert({
    where: { id: 1 },
    update: {
      credibilityPoints: whyChoosePoints,
      founderName: "CP Automation Team",
      founderRole: "Update founder role in the admin dashboard",
      longStory:
        "Add the founder story, company journey, and leadership profile from the admin dashboard.",
      metaDescription: buildMetaDescription(
        inventory.home?.aboutSummary?.subtitle,
        inventory.home?.aboutSummary?.missionCard?.body,
      ),
      metaTitle: `About ${inventory.company?.name ?? "CP Automation"}`,
      mission: cleanNullableString(inventory.home?.aboutSummary?.missionCard?.body),
      pageSubtitle: cleanNullableString(inventory.home?.aboutSummary?.subtitle),
      pageTitle: `About ${inventory.company?.name ?? "CP Automation"}`,
      primaryCtaLabel: "Talk to CP Automation",
      primaryCtaUrl: cleanNullableString(inventory.company?.whatsappLink),
      serviceLocations: locations,
      shortBio:
        "Update the founder bio, portrait, and experience details from the admin dashboard.",
      stats,
      values: [
        "Reliability in every installation",
        "Practical automation for daily life",
        "Responsive support for clients",
      ],
      vision:
        "To make dependable automation simple, accessible, and valuable for homes and businesses across Nigeria.",
      yearsOfExperience:
        stats.find((item) => String(item.label).toLowerCase().includes("year"))?.value ?? null,
    },
    create: {
      credibilityPoints: whyChoosePoints,
      founderName: "CP Automation Team",
      founderRole: "Update founder role in the admin dashboard",
      id: 1,
      longStory:
        "Add the founder story, company journey, and leadership profile from the admin dashboard.",
      metaDescription: buildMetaDescription(
        inventory.home?.aboutSummary?.subtitle,
        inventory.home?.aboutSummary?.missionCard?.body,
      ),
      metaTitle: `About ${inventory.company?.name ?? "CP Automation"}`,
      mission: cleanNullableString(inventory.home?.aboutSummary?.missionCard?.body),
      pageSubtitle: cleanNullableString(inventory.home?.aboutSummary?.subtitle),
      pageTitle: `About ${inventory.company?.name ?? "CP Automation"}`,
      primaryCtaLabel: "Talk to CP Automation",
      primaryCtaUrl: cleanNullableString(inventory.company?.whatsappLink),
      serviceLocations: locations,
      shortBio:
        "Update the founder bio, portrait, and experience details from the admin dashboard.",
      stats,
      values: [
        "Reliability in every installation",
        "Practical automation for daily life",
        "Responsive support for clients",
      ],
      vision:
        "To make dependable automation simple, accessible, and valuable for homes and businesses across Nigeria.",
      yearsOfExperience:
        stats.find((item) => String(item.label).toLowerCase().includes("year"))?.value ?? null,
    },
  });
}

async function importLegacyContentSections(): Promise<number> {
  const result = await query<LegacyContentSectionRow>(
    `
      SELECT section_name, content
      FROM content_sections
      ORDER BY section_name ASC
    `,
  );

  for (const [index, row] of result.rows.entries()) {
    await prisma!.pageSection.upsert({
      where: {
        pageType_sectionKey: {
          pageType: "GLOBAL",
          sectionKey: slugify(row.section_name),
        },
      },
      update: {
        body: cleanNullableString(row.content),
        content: {
          legacySectionName: row.section_name,
          source: "content_sections",
        },
        orderIndex: index,
        title: row.section_name,
      },
      create: {
        body: cleanNullableString(row.content),
        content: {
          legacySectionName: row.section_name,
          source: "content_sections",
        },
        orderIndex: index,
        pageType: "GLOBAL",
        sectionKey: slugify(row.section_name),
        title: row.section_name,
      },
    });
  }

  return result.rows.length;
}

async function importProjects(
  inventory: InventoryShape,
  uploadedById: number | null,
): Promise<number> {
  const result = await query<LegacyProjectRow>(
    `
      SELECT id, title, description, location, image_url, image_public_id
      FROM projects
      ORDER BY id ASC
    `,
  );

  for (const row of result.rows) {
    const inventoryProject = inventory.projects?.find(
      (item) => item.title.trim().toLowerCase() === row.title.trim().toLowerCase(),
    );

    const fallbackImageUrl =
      cleanNullableString(row.image_url) ?? cleanNullableString(inventoryProject?.image);
    const imageAssetId = fallbackImageUrl
      ? await findOrCreateMediaAsset({
          altText: row.title,
          folder: "legacy/projects",
          publicId: cleanNullableString(row.image_public_id),
          title: row.title,
          uploadedById,
          url: fallbackImageUrl,
        })
      : null;

    await prisma!.project.update({
      where: { id: row.id },
      data: {
        imageAssetId,
        metaDescription: buildMetaDescription(row.description, row.location),
        metaTitle: `${row.title} | CP Automation`,
        ogImageAssetId: imageAssetId,
        slug: slugify(row.title),
      },
    });
  }

  return result.rows.length;
}

async function importProducts(inventory: InventoryShape): Promise<number> {
  const result = await query<LegacyProductRow>(
    `
      SELECT id, name, description, features
      FROM products
      ORDER BY id ASC
    `,
  );

  for (const row of result.rows) {
    const inventoryProduct = inventory.products?.find(
      (item) => item.name.trim().toLowerCase() === row.name.trim().toLowerCase(),
    );

    await prisma!.product.update({
      where: { id: row.id },
      data: {
        ctaLabel: cleanNullableString(inventoryProduct?.ctaLabel) ?? "Get Quote",
        ctaUrl:
          cleanNullableString(inventoryProduct?.ctaUrl) ??
          cleanNullableString(inventory.company?.whatsappLink),
        featureList: inventoryProduct?.features ?? splitFeatureText(row.features),
        metaDescription: buildMetaDescription(row.description),
        metaTitle: `${row.name} | CP Automation`,
        slug: slugify(row.name),
      },
    });
  }

  return result.rows.length;
}

async function importServices(inventory: InventoryShape): Promise<number> {
  const result = await query<LegacyServiceRow>(
    `
      SELECT id, name, description, icon_name
      FROM services
      ORDER BY id ASC
    `,
  );

  for (const row of result.rows) {
    const inventoryService = inventory.services?.find(
      (item) => item.name.trim().toLowerCase() === row.name.trim().toLowerCase(),
    );

    await prisma!.service.update({
      where: { id: row.id },
      data: {
        ctaLabel: "Talk to Us",
        ctaUrl: cleanNullableString(inventory.company?.whatsappLink),
        highlightList: splitFeatureText(inventoryService?.description ?? row.description),
        metaDescription: buildMetaDescription(row.description),
        metaTitle: `${row.name} | CP Automation`,
        slug: slugify(row.name),
      },
    });
  }

  return result.rows.length;
}

async function importTestimonials(inventory: InventoryShape): Promise<number> {
  const result = await query<LegacyTestimonialRow>(
    `
      SELECT id, quote, author, location, rating
      FROM testimonials
      ORDER BY id ASC
    `,
  );

  for (const row of result.rows) {
    const inventoryTestimonial = inventory.testimonials?.find(
      (item) => item.quote.trim().toLowerCase() === row.quote.trim().toLowerCase(),
    );

    await prisma!.testimonial.update({
      where: { id: row.id },
      data: {
        authorRole: null,
        companyName: null,
        isFeatured: true,
        rating: inventoryTestimonial?.rating ?? row.rating ?? 5,
        sourceUrl: null,
      },
    });
  }

  return result.rows.length;
}

async function main(): Promise<void> {
  if (!prisma) {
    throw new Error("Prisma client is not configured. Add DATABASE_URL before running the import.");
  }

  const inventory = await loadInventory();
  const uploadedById = await getPrimaryAdminUserId();

  const migratedContentSections = await importLegacyContentSections();
  const migratedProjects = await importProjects(inventory, uploadedById);
  const migratedProducts = await importProducts(inventory);
  const migratedServices = await importServices(inventory);
  const migratedTestimonials = await importTestimonials(inventory);

  await importSiteSettings(inventory, uploadedById);
  await importHomePage(inventory);
  await importAboutPage(inventory);

  console.log(
    JSON.stringify(
      {
        status: "ok",
        migratedContentSections,
        migratedProducts,
        migratedProjects,
        migratedServices,
        migratedTestimonials,
        singletonRecords: ["site_settings", "home_pages", "about_pages"],
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Legacy import failed.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
