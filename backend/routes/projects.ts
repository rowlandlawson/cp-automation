import { Router } from "express";

import { deleteImageFromCloudinary } from "../config/cloudinary";
import { asyncHandler } from "../middleware/async-handler";
import { auth } from "../middleware/auth";
import { uploadProjectImage } from "../middleware/upload";
import { HttpError } from "../utils/http-error";
import {
  createMediaAssetFromUpload,
  deleteMediaAssetIfUnused,
  ensureMediaAssetExists,
  resolveMediaAssetId,
} from "../utils/prisma-media";
import { requirePrisma } from "../utils/prisma-request";
import { serializeProject } from "../utils/prisma-serializers";
import {
  nullableId,
  nullableString,
  optionalBoolean,
  optionalInteger,
  optionalString,
  parseIdParam,
  requireString,
} from "../utils/request";
import { slugify } from "../utils/slug";

const projectsRouter = Router();

const PROJECT_UPLOAD_FOLDER = "cp-automation/projects";

function deleteLegacyCloudinaryImage(publicId: string | null | undefined) {
  if (!publicId) {
    return;
  }

  void deleteImageFromCloudinary(publicId).catch((error) => {
    console.warn("[cloudinary] Failed to delete project image", error);
  });
}

projectsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const prisma = requirePrisma();
    const projects = await prisma.project.findMany({
      where: { isPublished: true },
      include: {
        imageAsset: true,
        ogImageAsset: true,
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
    });

    res.json(projects.map(serializeProject));
  }),
);

projectsRouter.get(
  "/admin/all",
  auth,
  asyncHandler(async (_req, res) => {
    const prisma = requirePrisma();
    const projects = await prisma.project.findMany({
      include: {
        imageAsset: true,
        ogImageAsset: true,
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
    });

    res.json(projects.map(serializeProject));
  }),
);

projectsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const projectId = parseIdParam(req.params.id, "project id");
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        imageAsset: true,
        ogImageAsset: true,
      },
    });

    if (!project) {
      throw new HttpError(404, "Project not found.");
    }

    res.json(serializeProject(project));
  }),
);

projectsRouter.post(
  "/",
  auth,
  ...uploadProjectImage,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const title = requireString(req.body.title, "title");
    const imageAssetIdInput = nullableId(req.body.image_asset_id, "image_asset_id");
    const ogImageAssetId = await resolveMediaAssetId(
      nullableId(req.body.og_image_asset_id, "og_image_asset_id"),
      "og_image_asset_id",
    );

    const uploadedAsset = req.uploadedImage
      ? await createMediaAssetFromUpload({
          altText: nullableString(req.body.image_alt_text, "image_alt_text") ?? title,
          folder: PROJECT_UPLOAD_FOLDER,
          title,
          uploadedById: req.userId ?? null,
          upload: req.uploadedImage,
        })
      : null;
    const selectedImageAsset = uploadedAsset
      ? uploadedAsset
      : imageAssetIdInput
        ? await ensureMediaAssetExists(imageAssetIdInput, "image_asset_id")
        : null;
    const manualImageUrl = nullableString(req.body.image_url, "image_url");
    const manualImagePublicId = nullableString(req.body.image_public_id, "image_public_id");

    const project = await prisma.project.create({
      data: {
        title,
        slug: optionalString(req.body.slug, "slug") ?? slugify(title),
        description: nullableString(req.body.description, "description") ?? null,
        location: nullableString(req.body.location, "location") ?? null,
        imageUrl:
          selectedImageAsset?.secureUrl ?? selectedImageAsset?.url ?? manualImageUrl ?? null,
        imagePublicId: selectedImageAsset?.publicId ?? manualImagePublicId ?? null,
        imageAssetId: selectedImageAsset?.id ?? null,
        ogImageAssetId: ogImageAssetId ?? null,
        metaTitle: nullableString(req.body.meta_title, "meta_title") ?? null,
        metaDescription: nullableString(req.body.meta_description, "meta_description") ?? null,
        orderIndex: optionalInteger(req.body.order_index, "order_index") ?? 0,
        isPublished: optionalBoolean(req.body.is_published, "is_published") ?? true,
      },
      include: {
        imageAsset: true,
        ogImageAsset: true,
      },
    });

    res.status(201).json(serializeProject(project));
  }),
);

projectsRouter.put(
  "/:id",
  auth,
  ...uploadProjectImage,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const projectId = parseIdParam(req.params.id, "project id");
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        imageAsset: true,
        ogImageAsset: true,
      },
    });

    if (!existingProject) {
      throw new HttpError(404, "Project not found.");
    }

    const nameTitle =
      req.body.title !== undefined ? requireString(req.body.title, "title") : undefined;
    const imageAssetInput = nullableId(req.body.image_asset_id, "image_asset_id");
    const ogImageAssetId = await resolveMediaAssetId(
      nullableId(req.body.og_image_asset_id, "og_image_asset_id"),
      "og_image_asset_id",
    );

    const uploadedAsset = req.uploadedImage
      ? await createMediaAssetFromUpload({
          altText:
            nullableString(req.body.image_alt_text, "image_alt_text") ??
            nameTitle ??
            existingProject.title,
          folder: PROJECT_UPLOAD_FOLDER,
          title: nameTitle ?? existingProject.title,
          uploadedById: req.userId ?? null,
          upload: req.uploadedImage,
        })
      : null;

    let nextImageAssetId: number | null | undefined;
    let nextImageUrl: string | null | undefined;
    let nextImagePublicId: string | null | undefined;

    if (uploadedAsset) {
      nextImageAssetId = uploadedAsset.id;
      nextImageUrl = uploadedAsset.secureUrl ?? uploadedAsset.url;
      nextImagePublicId = uploadedAsset.publicId ?? null;
    } else if (imageAssetInput !== undefined && imageAssetInput !== null) {
      const asset = await ensureMediaAssetExists(imageAssetInput, "image_asset_id");
      nextImageAssetId = asset.id;
      nextImageUrl = asset.secureUrl ?? asset.url;
      nextImagePublicId = asset.publicId ?? null;
    } else if (
      imageAssetInput === null ||
      req.body.image_url !== undefined ||
      req.body.image_public_id !== undefined
    ) {
      nextImageAssetId = null;
      nextImageUrl = nullableString(req.body.image_url, "image_url");
      nextImagePublicId = nullableString(req.body.image_public_id, "image_public_id");
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        title: nameTitle,
        slug: optionalString(req.body.slug, "slug") ?? (nameTitle ? slugify(nameTitle) : undefined),
        description: nullableString(req.body.description, "description"),
        location: nullableString(req.body.location, "location"),
        imageUrl: nextImageUrl,
        imagePublicId: nextImagePublicId,
        imageAssetId: nextImageAssetId,
        ogImageAssetId,
        metaTitle: nullableString(req.body.meta_title, "meta_title"),
        metaDescription: nullableString(req.body.meta_description, "meta_description"),
        orderIndex: optionalInteger(req.body.order_index, "order_index"),
        isPublished: optionalBoolean(req.body.is_published, "is_published"),
      },
      include: {
        imageAsset: true,
        ogImageAsset: true,
      },
    });

    if (
      existingProject.imageAssetId &&
      existingProject.imageAssetId !== updatedProject.imageAssetId
    ) {
      await deleteMediaAssetIfUnused(existingProject.imageAssetId);
    }

    if (
      existingProject.ogImageAssetId &&
      existingProject.ogImageAssetId !== updatedProject.ogImageAssetId
    ) {
      await deleteMediaAssetIfUnused(existingProject.ogImageAssetId);
    }

    if (
      !existingProject.imageAssetId &&
      existingProject.imagePublicId &&
      existingProject.imagePublicId !== updatedProject.imagePublicId
    ) {
      deleteLegacyCloudinaryImage(existingProject.imagePublicId);
    }

    res.json(serializeProject(updatedProject));
  }),
);

projectsRouter.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const projectId = parseIdParam(req.params.id, "project id");
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new HttpError(404, "Project not found.");
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    if (project.imageAssetId) {
      await deleteMediaAssetIfUnused(project.imageAssetId);
    } else if (project.imagePublicId) {
      deleteLegacyCloudinaryImage(project.imagePublicId);
    }

    if (project.ogImageAssetId) {
      await deleteMediaAssetIfUnused(project.ogImageAssetId);
    }

    res.json({
      message: "Project deleted.",
    });
  }),
);

export { projectsRouter };
