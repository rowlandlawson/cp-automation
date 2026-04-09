import bcryptjs from "bcryptjs";

import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { assertPasswordPolicy } from "../../utils/password-policy";
import { adminSeed } from "../seed-data";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function joinFeatureList(items: readonly string[]): string {
  return items.join("\n");
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordPolicy(password);
  return bcryptjs.hash(password, 12);
}

export function getAdminSeedConfig(): {
  email: string;
  password: string;
  role: string;
  username: string;
} {
  return {
    email: adminSeed.email,
    password: adminSeed.password,
    role: adminSeed.role,
    username: adminSeed.username,
  };
}

export async function upsertMediaAsset(
  prisma: PrismaClient,
  input: {
    altText?: string;
    folder: string;
    publicId: string;
    title: string;
    uploadedById?: number | null;
    url: string;
  },
): Promise<number> {
  const asset = await prisma.mediaAsset.upsert({
    where: { publicId: input.publicId },
    update: {
      altText: input.altText ?? null,
      fileName: input.url.split("/").at(-1) ?? input.title,
      folder: input.folder,
      secureUrl: input.url.startsWith("http") ? input.url : null,
      title: input.title,
      uploadedById: input.uploadedById ?? null,
      url: input.url,
    },
    create: {
      altText: input.altText ?? null,
      fileName: input.url.split("/").at(-1) ?? input.title,
      folder: input.folder,
      publicId: input.publicId,
      secureUrl: input.url.startsWith("http") ? input.url : null,
      title: input.title,
      uploadedById: input.uploadedById ?? null,
      url: input.url,
    },
    select: {
      id: true,
    },
  });

  return asset.id;
}
