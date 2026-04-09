import { Router } from "express";

import { PageType } from "../generated/prisma/enums";
import { asyncHandler } from "../middleware/async-handler";
import { auth } from "../middleware/auth";
import { cleanupReplacedMediaAsset } from "../utils/prisma-cleanup";
import { resolveMediaAssetId } from "../utils/prisma-media";
import { parseJsonInput, requirePrisma } from "../utils/prisma-request";
import { serializePageSection } from "../utils/prisma-serializers";
import {
  nullableId,
  nullableString,
  optionalBoolean,
  optionalInteger,
  optionalString,
  parseIdParam,
  readRouteParam,
  requireString,
} from "../utils/request";
import { HttpError } from "../utils/http-error";

const pageSectionsRouter = Router();

function parsePageType(value: unknown, fieldName = "page_type"): PageType {
  const normalized = readRouteParam(value, fieldName).trim().toUpperCase();

  if (normalized in PageType) {
    return PageType[normalized as keyof typeof PageType];
  }

  throw new HttpError(400, `${fieldName} must be HOME, ABOUT, or GLOBAL.`);
}

function normalizeSectionKey(value: unknown, fieldName = "section_key"): string {
  const normalized = requireString(value, fieldName)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) {
    throw new HttpError(400, `${fieldName} is required.`);
  }

  return normalized;
}

function optionalSectionKey(value: unknown, fieldName = "section_key"): string | undefined {
  const nextValue = optionalString(value, fieldName);
  return nextValue === undefined ? undefined : normalizeSectionKey(nextValue, fieldName);
}

pageSectionsRouter.get(
  "/page/:pageType",
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const pageType = parsePageType(req.params.pageType, "page type");

    const sections = await prisma.pageSection.findMany({
      where: {
        pageType,
        isPublished: true,
      },
      include: {
        featuredAsset: true,
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    });

    res.json(sections.map(serializePageSection));
  }),
);

pageSectionsRouter.get(
  "/page/:pageType/:sectionKey",
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const pageType = parsePageType(req.params.pageType, "page type");
    const sectionKey = normalizeSectionKey(req.params.sectionKey, "section key");

    const section = await prisma.pageSection.findUnique({
      where: {
        pageType_sectionKey: {
          pageType,
          sectionKey,
        },
      },
      include: {
        featuredAsset: true,
      },
    });

    if (!section || !section.isPublished) {
      throw new HttpError(404, "Page section not found.");
    }

    res.json(serializePageSection(section));
  }),
);

pageSectionsRouter.get(
  "/admin/all",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const pageType =
      req.query.page_type !== undefined
        ? parsePageType(req.query.page_type, "page_type")
        : undefined;

    const sections = await prisma.pageSection.findMany({
      where: {
        pageType,
      },
      include: {
        featuredAsset: true,
      },
      orderBy: [{ pageType: "asc" }, { orderIndex: "asc" }, { createdAt: "asc" }],
    });

    res.json(sections.map(serializePageSection));
  }),
);

pageSectionsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const sectionId = parseIdParam(req.params.id, "page section id");

    const section = await prisma.pageSection.findUnique({
      where: { id: sectionId },
      include: {
        featuredAsset: true,
      },
    });

    if (!section) {
      throw new HttpError(404, "Page section not found.");
    }

    res.json(serializePageSection(section));
  }),
);

pageSectionsRouter.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const featuredAssetId = await resolveMediaAssetId(
      nullableId(req.body.featured_asset_id, "featured_asset_id"),
      "featured_asset_id",
    );

    const section = await prisma.pageSection.create({
      data: {
        pageType: parsePageType(req.body.page_type),
        sectionKey: normalizeSectionKey(req.body.section_key),
        title: nullableString(req.body.title, "title") ?? null,
        subtitle: nullableString(req.body.subtitle, "subtitle") ?? null,
        body: nullableString(req.body.body, "body") ?? null,
        content: parseJsonInput(req.body.content, "content") ?? undefined,
        ctaLabel: nullableString(req.body.cta_label, "cta_label") ?? null,
        ctaUrl: nullableString(req.body.cta_url, "cta_url") ?? null,
        featuredAssetId: featuredAssetId ?? null,
        orderIndex: optionalInteger(req.body.order_index, "order_index") ?? 0,
        isPublished: optionalBoolean(req.body.is_published, "is_published") ?? true,
      },
      include: {
        featuredAsset: true,
      },
    });

    res.status(201).json(serializePageSection(section));
  }),
);

pageSectionsRouter.put(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const sectionId = parseIdParam(req.params.id, "page section id");
    const existingSection = await prisma.pageSection.findUnique({
      where: { id: sectionId },
      include: {
        featuredAsset: true,
      },
    });

    if (!existingSection) {
      throw new HttpError(404, "Page section not found.");
    }

    const featuredAssetId = await resolveMediaAssetId(
      nullableId(req.body.featured_asset_id, "featured_asset_id"),
      "featured_asset_id",
    );

    const updatedSection = await prisma.pageSection.update({
      where: { id: sectionId },
      data: {
        pageType: req.body.page_type !== undefined ? parsePageType(req.body.page_type) : undefined,
        sectionKey: optionalSectionKey(req.body.section_key),
        title: nullableString(req.body.title, "title"),
        subtitle: nullableString(req.body.subtitle, "subtitle"),
        body: nullableString(req.body.body, "body"),
        content: parseJsonInput(req.body.content, "content"),
        ctaLabel: nullableString(req.body.cta_label, "cta_label"),
        ctaUrl: nullableString(req.body.cta_url, "cta_url"),
        featuredAssetId,
        orderIndex: optionalInteger(req.body.order_index, "order_index"),
        isPublished: optionalBoolean(req.body.is_published, "is_published"),
      },
      include: {
        featuredAsset: true,
      },
    });

    await cleanupReplacedMediaAsset(
      existingSection.featuredAssetId,
      updatedSection.featuredAssetId,
    );

    res.json(serializePageSection(updatedSection));
  }),
);

pageSectionsRouter.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const sectionId = parseIdParam(req.params.id, "page section id");
    const section = await prisma.pageSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new HttpError(404, "Page section not found.");
    }

    await prisma.pageSection.delete({
      where: { id: sectionId },
    });

    await cleanupReplacedMediaAsset(section.featuredAssetId, null);

    res.json({
      message: "Page section deleted.",
    });
  }),
);

export { pageSectionsRouter };
