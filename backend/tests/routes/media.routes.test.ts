import { describe, expect, it } from "bun:test";

import { env } from "../../config/env";
import {
  createAuthToken,
  createPngBlob,
  createTestUser,
  getJsonObject,
  startApiTestServer,
} from "../helpers/api-test-helpers";

function createMediaAssetRecord(
  overrides: Partial<{
    altText: string | null;
    assetType: string;
    bytes: number | null;
    createdAt: Date;
    fileName: string | null;
    folder: string | null;
    height: number | null;
    id: number;
    mimeType: string | null;
    publicId: string | null;
    secureUrl: string | null;
    title: string | null;
    updatedAt: Date;
    uploadedById: number | null;
    url: string;
    width: number | null;
  }> = {},
) {
  return {
    altText: "Original panel photo",
    assetType: "IMAGE",
    bytes: 1024,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    fileName: "panel-photo.webp",
    folder: "cp-automation/media",
    height: 630,
    id: 9,
    mimeType: "image/webp",
    publicId: "cp-automation/media/panel-photo",
    secureUrl: "https://cdn.example.com/panel-photo.webp",
    title: "Panel photo",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    uploadedById: 1,
    url: "https://cdn.example.com/panel-photo.webp",
    width: 1200,
    ...overrides,
  };
}

describe("media routes", () => {
  it("updates media metadata without changing the asset record identity", async () => {
    const user = createTestUser();
    const token = createAuthToken(user);
    const existingAsset = createMediaAssetRecord();
    const server = await startApiTestServer({
      mediaAsset: {
        findUnique: async () => existingAsset,
        update: async ({
          data,
        }: {
          data: {
            altText?: string | null;
            title?: string | null;
          };
        }) =>
          createMediaAssetRecord({
            altText: data.altText ?? existingAsset.altText,
            title: data.title ?? existingAsset.title,
            updatedAt: new Date("2026-04-08T09:30:00.000Z"),
          }),
      },
      user: {
        findUnique: async () => user,
      },
    });

    try {
      const response = await server.request("/api/media/9", {
        body: {
          alt_text: "Updated panel photo",
          title: "Updated title",
        },
        method: "PUT",
        token,
      });
      const payload = getJsonObject(response, "updated media asset");

      expect(response.status).toBe(200);
      expect(payload.id).toBe(existingAsset.id);
      expect(payload.alt_text).toBe("Updated panel photo");
      expect(payload.title).toBe("Updated title");
    } finally {
      await server.close();
    }
  });

  it("prevents deleting media assets that are still referenced", async () => {
    const user = createTestUser();
    const token = createAuthToken(user);
    const existingAsset = createMediaAssetRecord();
    const server = await startApiTestServer({
      aboutPage: {
        count: async () => 0,
      },
      homePage: {
        count: async () => 0,
      },
      mediaAsset: {
        findUnique: async () => existingAsset,
      },
      pageSection: {
        count: async () => 0,
      },
      product: {
        count: async () => 1,
      },
      project: {
        count: async () => 0,
      },
      service: {
        count: async () => 0,
      },
      siteSettings: {
        count: async () => 0,
      },
      user: {
        findUnique: async () => user,
      },
    });

    try {
      const response = await server.request("/api/media/9", {
        method: "DELETE",
        token,
      });
      const payload = getJsonObject(response, "referenced media asset");

      expect(response.status).toBe(409);
      expect(payload.error).toBe(
        "Media asset is still referenced by website content and cannot be deleted.",
      );
    } finally {
      await server.close();
    }
  });

  it("returns 500 when upload is attempted without Cloudinary configuration", async () => {
    const previousCloudinary = {
      apiKey: env.CLOUDINARY_API_KEY,
      apiSecret: env.CLOUDINARY_API_SECRET,
      cloudName: env.CLOUDINARY_NAME,
    };
    const user = createTestUser();
    const token = createAuthToken(user);

    env.CLOUDINARY_API_KEY = "";
    env.CLOUDINARY_API_SECRET = "";
    env.CLOUDINARY_NAME = "";

    const server = await startApiTestServer({
      user: {
        findUnique: async () => user,
      },
    });

    try {
      const formData = new FormData();
      formData.append("image", createPngBlob(), "phase-4-media.png");
      formData.append("alt_text", "Phase 4 media alt");
      formData.append("title", "Phase 4 media title");

      const response = await server.request("/api/media/upload", {
        body: formData,
        method: "POST",
        token,
      });
      const payload = getJsonObject(response, "media upload without cloudinary");

      expect(response.status).toBe(500);
      expect(payload.error).toBe("Cloudinary is not configured.");
    } finally {
      env.CLOUDINARY_API_KEY = previousCloudinary.apiKey;
      env.CLOUDINARY_API_SECRET = previousCloudinary.apiSecret;
      env.CLOUDINARY_NAME = previousCloudinary.cloudName;
      await server.close();
    }
  });
});
