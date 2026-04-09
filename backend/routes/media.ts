import { Router } from "express";

import { asyncHandler } from "../middleware/async-handler";
import { auth } from "../middleware/auth";
import { uploadMediaImage } from "../middleware/upload";
import { HttpError } from "../utils/http-error";
import {
  createMediaAssetFromUpload,
  deleteMediaAssetIfUnused,
  getMediaAssetReferenceCount,
} from "../utils/prisma-media";
import { requirePrisma } from "../utils/prisma-request";
import { serializeMediaAsset } from "../utils/prisma-serializers";
import { nullableString, parseIdParam } from "../utils/request";

const mediaRouter = Router();

const MEDIA_UPLOAD_FOLDER = "cp-automation/media";

mediaRouter.get(
  "/",
  auth,
  asyncHandler(async (_req, res) => {
    const prisma = requirePrisma();
    const mediaAssets = await prisma.mediaAsset.findMany({
      orderBy: [{ createdAt: "desc" }],
    });

    res.json(mediaAssets.map(serializeMediaAsset));
  }),
);

mediaRouter.get(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const assetId = parseIdParam(req.params.id, "media asset id");
    const mediaAsset = await prisma.mediaAsset.findUnique({
      where: { id: assetId },
    });

    if (!mediaAsset) {
      throw new HttpError(404, "Media asset not found.");
    }

    res.json(serializeMediaAsset(mediaAsset));
  }),
);

mediaRouter.post(
  "/upload",
  auth,
  ...uploadMediaImage,
  asyncHandler(async (req, res) => {
    if (!req.uploadedImage) {
      throw new HttpError(400, "An image file is required.");
    }

    const mediaAsset = await createMediaAssetFromUpload({
      altText: nullableString(req.body.alt_text, "alt_text") ?? null,
      folder: MEDIA_UPLOAD_FOLDER,
      title: nullableString(req.body.title, "title") ?? null,
      uploadedById: req.userId ?? null,
      upload: req.uploadedImage,
    });

    res.status(201).json(serializeMediaAsset(mediaAsset));
  }),
);

mediaRouter.put(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const assetId = parseIdParam(req.params.id, "media asset id");
    const existingAsset = await prisma.mediaAsset.findUnique({
      where: { id: assetId },
    });

    if (!existingAsset) {
      throw new HttpError(404, "Media asset not found.");
    }

    const mediaAsset = await prisma.mediaAsset.update({
      where: { id: assetId },
      data: {
        altText: nullableString(req.body.alt_text, "alt_text"),
        title: nullableString(req.body.title, "title"),
      },
    });

    res.json(serializeMediaAsset(mediaAsset));
  }),
);

mediaRouter.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const assetId = parseIdParam(req.params.id, "media asset id");
    const mediaAsset = await prisma.mediaAsset.findUnique({
      where: { id: assetId },
    });

    if (!mediaAsset) {
      throw new HttpError(404, "Media asset not found.");
    }

    const referenceCount = await getMediaAssetReferenceCount(assetId);
    if (referenceCount > 0) {
      throw new HttpError(
        409,
        "Media asset is still referenced by website content and cannot be deleted.",
      );
    }

    await deleteMediaAssetIfUnused(assetId);

    res.json({
      message: "Media asset deleted.",
    });
  }),
);

export { mediaRouter };
