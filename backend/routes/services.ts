import { Router } from "express";

import { asyncHandler } from "../middleware/async-handler";
import { auth } from "../middleware/auth";
import { cleanupReplacedMediaAsset } from "../utils/prisma-cleanup";
import { HttpError } from "../utils/http-error";
import { resolveMediaAssetId } from "../utils/prisma-media";
import { requirePrisma, parseJsonInput } from "../utils/prisma-request";
import { serializeService } from "../utils/prisma-serializers";
import { slugify } from "../utils/slug";
import {
  nullableId,
  nullableString,
  optionalBoolean,
  optionalInteger,
  optionalString,
  parseIdParam,
  requireString,
} from "../utils/request";

const servicesRouter = Router();

servicesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const prisma = requirePrisma();
    const services = await prisma.service.findMany({
      where: { isPublished: true },
      include: {
        featuredAsset: true,
        ogImageAsset: true,
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
    });
    res.json(services.map(serializeService));
  }),
);

servicesRouter.get(
  "/admin/all",
  auth,
  asyncHandler(async (_req, res) => {
    const prisma = requirePrisma();
    const services = await prisma.service.findMany({
      include: {
        featuredAsset: true,
        ogImageAsset: true,
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
    });
    res.json(services.map(serializeService));
  }),
);

servicesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const serviceId = parseIdParam(req.params.id, "service id");
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        featuredAsset: true,
        ogImageAsset: true,
      },
    });

    if (!service) {
      throw new HttpError(404, "Service not found.");
    }

    res.json(serializeService(service));
  }),
);

servicesRouter.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const name = requireString(req.body.name, "name");
    const featuredAssetId = await resolveMediaAssetId(
      nullableId(req.body.featured_asset_id, "featured_asset_id"),
      "featured_asset_id",
    );
    const ogImageAssetId = await resolveMediaAssetId(
      nullableId(req.body.og_image_asset_id, "og_image_asset_id"),
      "og_image_asset_id",
    );
    const service = await prisma.service.create({
      data: {
        name,
        slug: optionalString(req.body.slug, "slug") ?? slugify(name),
        description: nullableString(req.body.description, "description") ?? null,
        iconName: nullableString(req.body.icon_name, "icon_name") ?? null,
        highlightList: parseJsonInput(req.body.highlight_list, "highlight_list"),
        ctaLabel: nullableString(req.body.cta_label, "cta_label") ?? null,
        ctaUrl: nullableString(req.body.cta_url, "cta_url") ?? null,
        featuredAssetId: featuredAssetId ?? null,
        ogImageAssetId: ogImageAssetId ?? null,
        metaTitle: nullableString(req.body.meta_title, "meta_title") ?? null,
        metaDescription: nullableString(req.body.meta_description, "meta_description") ?? null,
        orderIndex: optionalInteger(req.body.order_index, "order_index") ?? 0,
        isPublished: optionalBoolean(req.body.is_published, "is_published") ?? true,
      },
      include: {
        featuredAsset: true,
        ogImageAsset: true,
      },
    });

    res.status(201).json(serializeService(service));
  }),
);

servicesRouter.put(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const serviceId = parseIdParam(req.params.id, "service id");
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!existingService) {
      throw new HttpError(404, "Service not found.");
    }

    const name = req.body.name !== undefined ? requireString(req.body.name, "name") : undefined;
    const featuredAssetId = await resolveMediaAssetId(
      nullableId(req.body.featured_asset_id, "featured_asset_id"),
      "featured_asset_id",
    );
    const ogImageAssetId = await resolveMediaAssetId(
      nullableId(req.body.og_image_asset_id, "og_image_asset_id"),
      "og_image_asset_id",
    );
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name,
        slug: optionalString(req.body.slug, "slug") ?? (name ? slugify(name) : undefined),
        description: nullableString(req.body.description, "description"),
        iconName: nullableString(req.body.icon_name, "icon_name"),
        highlightList: parseJsonInput(req.body.highlight_list, "highlight_list"),
        ctaLabel: nullableString(req.body.cta_label, "cta_label"),
        ctaUrl: nullableString(req.body.cta_url, "cta_url"),
        featuredAssetId,
        ogImageAssetId,
        metaTitle: nullableString(req.body.meta_title, "meta_title"),
        metaDescription: nullableString(req.body.meta_description, "meta_description"),
        orderIndex: optionalInteger(req.body.order_index, "order_index"),
        isPublished: optionalBoolean(req.body.is_published, "is_published"),
      },
      include: {
        featuredAsset: true,
        ogImageAsset: true,
      },
    });

    await cleanupReplacedMediaAsset(
      existingService.featuredAssetId,
      updatedService.featuredAssetId,
    );
    await cleanupReplacedMediaAsset(existingService.ogImageAssetId, updatedService.ogImageAssetId);

    res.json(serializeService(updatedService));
  }),
);

servicesRouter.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const serviceId = parseIdParam(req.params.id, "service id");
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new HttpError(404, "Service not found.");
    }

    await prisma.service.delete({
      where: { id: serviceId },
    });

    await cleanupReplacedMediaAsset(service.featuredAssetId, null);
    await cleanupReplacedMediaAsset(service.ogImageAssetId, null);

    res.json({
      message: "Service deleted.",
    });
  }),
);

export { servicesRouter };
