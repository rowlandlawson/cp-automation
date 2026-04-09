import type { PrismaClient, User } from "../../generated/prisma/client";
import { seedAboutPage } from "./about-page";
import { seedAdminUser } from "./admin";
import { seedLegacyContentSections } from "./content-sections";
import { seedHomePage } from "./home-page";
import { seedMediaAssets, type SeededMediaAssets } from "./media";
import { seedPageSections } from "./page-sections";
import { seedProducts } from "./products";
import { seedProjects } from "./projects";
import { seedServices } from "./services";
import { seedSiteSettings } from "./site-settings";
import { seedTestimonials } from "./testimonials";

export const SEED_SCOPE_ORDER = [
  "admin",
  "media",
  "site-settings",
  "home-page",
  "about-page",
  "products",
  "services",
  "projects",
  "testimonials",
  "page-sections",
  "content-sections",
] as const;

export type SeedScope = (typeof SEED_SCOPE_ORDER)[number];

type SeedExecutionState = {
  adminUser: User | null;
  mediaAssets: SeededMediaAssets | null;
  summary: {
    aboutPage: number;
    adminUser: { email: string; id: number; username: string } | null;
    contentSections: number;
    homePage: number;
    mediaAssets: number;
    pageSections: number;
    products: number;
    projects: number;
    services: number;
    siteSettings: number;
    testimonials: number;
  };
};

const SEED_SCOPE_DEPENDENCIES: Record<SeedScope, SeedScope[]> = {
  admin: [],
  media: ["admin"],
  "site-settings": ["media"],
  "home-page": ["media"],
  "about-page": ["media"],
  products: [],
  services: [],
  projects: ["media"],
  testimonials: [],
  "page-sections": [],
  "content-sections": ["admin"],
};

function isSeedScope(value: string): value is SeedScope {
  return SEED_SCOPE_ORDER.includes(value as SeedScope);
}

function normalizeScopeName(value: string): SeedScope {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (!isSeedScope(normalized)) {
    throw new Error(`Unknown seed scope "${value}". Valid scopes: ${SEED_SCOPE_ORDER.join(", ")}.`);
  }

  return normalized;
}

export function resolveSeedScopes(requestedScopes: SeedScope[]): SeedScope[] {
  const resolved = new Set<SeedScope>();

  function visit(scope: SeedScope): void {
    for (const dependency of SEED_SCOPE_DEPENDENCIES[scope]) {
      visit(dependency);
    }

    resolved.add(scope);
  }

  requestedScopes.forEach(visit);

  return SEED_SCOPE_ORDER.filter((scope) => resolved.has(scope));
}

function assertAdminUser(state: SeedExecutionState): User {
  if (!state.adminUser) {
    throw new Error("Admin user seed must run before this scope.");
  }

  return state.adminUser;
}

function assertMediaAssets(state: SeedExecutionState): SeededMediaAssets {
  if (!state.mediaAssets) {
    throw new Error("Media seed must run before this scope.");
  }

  return state.mediaAssets;
}

export function parseSeedScopes(args: string[]): SeedScope[] {
  const rawScopes: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument) {
      continue;
    }

    if (argument === "--scope") {
      const nextValue = args[index + 1];
      if (!nextValue) {
        throw new Error("Missing value for --scope.");
      }

      rawScopes.push(
        ...nextValue
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      );
      index += 1;
      continue;
    }

    if (argument.startsWith("--scope=")) {
      rawScopes.push(
        ...argument
          .slice("--scope=".length)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      );
    }
  }

  if (rawScopes.length === 0 || rawScopes.includes("all")) {
    return [...SEED_SCOPE_ORDER];
  }

  return Array.from(new Set(rawScopes.map(normalizeScopeName)));
}

export async function runSeedScopes(
  prisma: PrismaClient,
  requestedScopes: SeedScope[],
): Promise<{
  executedScopes: SeedScope[];
  summary: SeedExecutionState["summary"];
}> {
  const executedScopes = resolveSeedScopes(requestedScopes);
  const state: SeedExecutionState = {
    adminUser: null,
    mediaAssets: null,
    summary: {
      aboutPage: 0,
      adminUser: null,
      contentSections: 0,
      homePage: 0,
      mediaAssets: 0,
      pageSections: 0,
      products: 0,
      projects: 0,
      services: 0,
      siteSettings: 0,
      testimonials: 0,
    },
  };

  for (const scope of executedScopes) {
    switch (scope) {
      case "admin": {
        const adminUser = await seedAdminUser(prisma);
        state.adminUser = adminUser;
        state.summary.adminUser = {
          email: adminUser.email,
          id: adminUser.id,
          username: adminUser.username,
        };
        break;
      }
      case "media": {
        state.mediaAssets = await seedMediaAssets(prisma, assertAdminUser(state).id);
        state.summary.mediaAssets = state.mediaAssets.count;
        break;
      }
      case "site-settings": {
        const mediaAssets = assertMediaAssets(state);
        state.summary.siteSettings = await seedSiteSettings(prisma, {
          homeOgId: mediaAssets.homeOgId,
          logoId: mediaAssets.logoId,
        });
        break;
      }
      case "home-page": {
        const mediaAssets = assertMediaAssets(state);
        state.summary.homePage = await seedHomePage(prisma, {
          homeOgId: mediaAssets.homeOgId,
        });
        break;
      }
      case "about-page": {
        const mediaAssets = assertMediaAssets(state);
        state.summary.aboutPage = await seedAboutPage(prisma, {
          homeOgId: mediaAssets.homeOgId,
          portraitId: mediaAssets.portraitId,
        });
        break;
      }
      case "products":
        state.summary.products = await seedProducts(prisma);
        break;
      case "services":
        state.summary.services = await seedServices(prisma);
        break;
      case "projects":
        state.summary.projects = await seedProjects(
          prisma,
          assertMediaAssets(state).projectAssetIds,
        );
        break;
      case "testimonials":
        state.summary.testimonials = await seedTestimonials(prisma);
        break;
      case "page-sections":
        state.summary.pageSections = await seedPageSections(prisma);
        break;
      case "content-sections":
        state.summary.contentSections = await seedLegacyContentSections(
          prisma,
          assertAdminUser(state).id,
        );
        break;
    }
  }

  return {
    executedScopes,
    summary: state.summary,
  };
}
