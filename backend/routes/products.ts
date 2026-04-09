import { Router } from "express";

import { asyncHandler } from "../middleware/async-handler";
import { auth } from "../middleware/auth";
import { cleanupReplacedMediaAsset } from "../utils/prisma-cleanup";
import { HttpError } from "../utils/http-error";
import { resolveMediaAssetId } from "../utils/prisma-media";
import { requirePrisma, parseJsonInput } from "../utils/prisma-request";
import {
  nullableId,
  nullableString,
  optionalBoolean,
  optionalInteger,
  optionalString,
  parseIdParam,
  requireString,
} from "../utils/request";
import { serializeProduct } from "../utils/prisma-serializers";
import { slugify } from "../utils/slug";

const productsRouter = Router();

productsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const prisma = requirePrisma();

    const products = await prisma.product.findMany({
      where: { isPublished: true },
      include: {
        featuredAsset: true,
        ogImageAsset: true,
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
    });
    res.json(products.map(serializeProduct));
  }),
);

productsRouter.get(
  "/admin/all",
  auth,
  asyncHandler(async (_req, res) => {
    const prisma = requirePrisma();

    const products = await prisma.product.findMany({
      include: {
        featuredAsset: true,
        ogImageAsset: true,
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
    });
    res.json(products.map(serializeProduct));
  }),
);

productsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();

    const productId = parseIdParam(req.params.id, "product id");
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        featuredAsset: true,
        ogImageAsset: true,
      },
    });

    if (!product) {
      throw new HttpError(404, "Product not found.");
    }

    res.json(serializeProduct(product));
  }),
);

productsRouter.post(
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
    const product = await prisma.product.create({
      data: {
        name,
        slug: optionalString(req.body.slug, "slug") ?? slugify(name),
        description: nullableString(req.body.description, "description") ?? null,
        features: nullableString(req.body.features, "features") ?? null,
        featureList: parseJsonInput(req.body.feature_list, "feature_list"),
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

    res.status(201).json(serializeProduct(product));
  }),
);

productsRouter.put(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();

    const productId = parseIdParam(req.params.id, "product id");
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      throw new HttpError(404, "Product not found.");
    }

    const name = req.body.name !== undefined ? requireString(req.body.name, "name") : undefined;
    const featuredAssetInput = nullableId(req.body.featured_asset_id, "featured_asset_id");
    const ogImageAssetInput = nullableId(req.body.og_image_asset_id, "og_image_asset_id");
    const featuredAssetId = await resolveMediaAssetId(featuredAssetInput, "featured_asset_id");
    const ogImageAssetId = await resolveMediaAssetId(ogImageAssetInput, "og_image_asset_id");
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        slug: optionalString(req.body.slug, "slug") ?? (name ? slugify(name) : undefined),
        description: nullableString(req.body.description, "description"),
        features: nullableString(req.body.features, "features"),
        featureList: parseJsonInput(req.body.feature_list, "feature_list"),
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
      existingProduct.featuredAssetId,
      updatedProduct.featuredAssetId,
    );
    await cleanupReplacedMediaAsset(existingProduct.ogImageAssetId, updatedProduct.ogImageAssetId);

    res.json(serializeProduct(updatedProduct));
  }),
);

productsRouter.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();

    const productId = parseIdParam(req.params.id, "product id");
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new HttpError(404, "Product not found.");
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    await cleanupReplacedMediaAsset(product.featuredAssetId, null);
    await cleanupReplacedMediaAsset(product.ogImageAssetId, null);

    res.json({
      message: "Product deleted.",
    });
  }),
);

export { productsRouter };
