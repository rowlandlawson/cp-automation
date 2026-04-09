import type { MediaAsset } from "../generated/prisma/client";
import { deleteImageFromCloudinary, uploadImageBuffer } from "../config/cloudinary";
import { HttpError } from "./http-error";
import { requirePrisma } from "./prisma-request";

export async function createMediaAssetFromUpload(input: {
  altText?: string | null;
  folder: string;
  publicId?: string | null;
  title?: string | null;
  uploadedById?: number | null;
  upload: {
    bytes?: number;
    format?: string;
    height?: number;
    publicId: string;
    secureUrl: string;
    width?: number;
  };
}): Promise<MediaAsset> {
  const prisma = requirePrisma();

  return prisma.mediaAsset.upsert({
    where: { publicId: input.upload.publicId },
    update: {
      altText: input.altText ?? null,
      bytes: input.upload.bytes ?? null,
      folder: input.folder,
      height: input.upload.height ?? null,
      mimeType: input.upload.format ? `image/${input.upload.format}` : null,
      publicId: input.upload.publicId,
      secureUrl: input.upload.secureUrl,
      title: input.title ?? null,
      uploadedById: input.uploadedById ?? null,
      url: input.upload.secureUrl,
      width: input.upload.width ?? null,
    },
    create: {
      altText: input.altText ?? null,
      bytes: input.upload.bytes ?? null,
      fileName: input.upload.publicId.split("/").at(-1) ?? input.upload.publicId,
      folder: input.folder,
      height: input.upload.height ?? null,
      mimeType: input.upload.format ? `image/${input.upload.format}` : null,
      publicId: input.upload.publicId,
      secureUrl: input.upload.secureUrl,
      title: input.title ?? null,
      uploadedById: input.uploadedById ?? null,
      url: input.upload.secureUrl,
      width: input.upload.width ?? null,
    },
  });
}

export async function ensureMediaAssetExists(
  assetId: number,
  fieldName = "media asset id",
): Promise<MediaAsset> {
  const prisma = requirePrisma();

  const asset = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new HttpError(404, `${fieldName} was not found.`);
  }

  return asset;
}

export async function resolveMediaAssetId(
  assetId: number | null | undefined,
  fieldName: string,
): Promise<number | null | undefined> {
  if (assetId === undefined || assetId === null) {
    return assetId;
  }

  await ensureMediaAssetExists(assetId, fieldName);
  return assetId;
}

export async function uploadImageAsMediaAsset(input: {
  altText?: string | null;
  buffer: Buffer;
  folder: string;
  publicId?: string | null;
  title?: string | null;
  uploadedById?: number | null;
}): Promise<MediaAsset> {
  const upload = await uploadImageBuffer({
    buffer: input.buffer,
    folder: input.folder,
    publicId: input.publicId ?? undefined,
  });

  return createMediaAssetFromUpload({
    altText: input.altText,
    folder: input.folder,
    publicId: input.publicId,
    title: input.title,
    uploadedById: input.uploadedById,
    upload,
  });
}

export async function getMediaAssetReferenceCount(assetId: number): Promise<number> {
  const prisma = requirePrisma();

  const [
    siteSettingsCount,
    homePageCount,
    aboutPageCount,
    pageSectionCount,
    projectCount,
    productCount,
    serviceCount,
  ] = await Promise.all([
    prisma.siteSettings.count({
      where: {
        OR: [{ logoAssetId: assetId }, { defaultOgImageAssetId: assetId }],
      },
    }),
    prisma.homePage.count({
      where: {
        OR: [{ heroVisualAssetId: assetId }, { ogImageAssetId: assetId }],
      },
    }),
    prisma.aboutPage.count({
      where: {
        OR: [{ portraitAssetId: assetId }, { ogImageAssetId: assetId }],
      },
    }),
    prisma.pageSection.count({
      where: { featuredAssetId: assetId },
    }),
    prisma.project.count({
      where: {
        OR: [{ imageAssetId: assetId }, { ogImageAssetId: assetId }],
      },
    }),
    prisma.product.count({
      where: {
        OR: [{ featuredAssetId: assetId }, { ogImageAssetId: assetId }],
      },
    }),
    prisma.service.count({
      where: {
        OR: [{ featuredAssetId: assetId }, { ogImageAssetId: assetId }],
      },
    }),
  ]);

  return (
    siteSettingsCount +
    homePageCount +
    aboutPageCount +
    pageSectionCount +
    projectCount +
    productCount +
    serviceCount
  );
}

export async function deleteMediaAssetIfUnused(assetId: number | null | undefined): Promise<void> {
  if (!assetId) {
    return;
  }

  const prisma = requirePrisma();

  const referenceCount = await getMediaAssetReferenceCount(assetId);

  if (referenceCount > 0) {
    return;
  }

  const asset = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    return;
  }

  if (asset.publicId) {
    await deleteImageFromCloudinary(asset.publicId);
  }

  await prisma.mediaAsset.delete({
    where: { id: assetId },
  });
}
