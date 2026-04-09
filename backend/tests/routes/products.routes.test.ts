import { describe, expect, it } from "bun:test";

import {
  createAuthToken,
  createPrismaKnownRequestError,
  createTestUser,
  getJsonArray,
  getJsonObject,
  startApiTestServer,
} from "../helpers/api-test-helpers";

function createProductRecord(
  overrides: Partial<{
    createdAt: Date;
    ctaLabel: string | null;
    ctaUrl: string | null;
    description: string | null;
    featureList: string[] | null;
    featuredAsset: null;
    featuredAssetId: number | null;
    features: string | null;
    id: number;
    isPublished: boolean;
    metaDescription: string | null;
    metaTitle: string | null;
    name: string;
    ogImageAsset: null;
    ogImageAssetId: number | null;
    orderIndex: number;
    slug: string;
    updatedAt: Date;
  }> = {},
) {
  return {
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ctaLabel: "Request quote",
    ctaUrl: "https://cpautomation.example.com/contact",
    description: "Industrial automation product",
    featureList: ["Design", "Commissioning"],
    featuredAsset: null,
    featuredAssetId: null,
    features: "Feature summary",
    id: 1,
    isPublished: true,
    metaDescription: "Meta description",
    metaTitle: "Meta title",
    name: "Control Panel Retrofit",
    ogImageAsset: null,
    ogImageAssetId: null,
    orderIndex: 1,
    slug: "control-panel-retrofit",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("product routes", () => {
  it("returns the expected public product contract", async () => {
    const product = createProductRecord();
    const server = await startApiTestServer({
      product: {
        findMany: async () => [product],
      },
    });

    try {
      const response = await server.request("/api/products");
      const payload = getJsonArray(response, "public products");
      const firstProduct = payload[0] as Record<string, unknown>;

      expect(response.status).toBe(200);
      expect(payload).toHaveLength(1);
      expect(firstProduct.name).toBe(product.name);
      expect(firstProduct.slug).toBe(product.slug);
      expect(firstProduct.feature_list).toEqual(product.featureList);
      expect(firstProduct.is_published).toBe(true);
      expect(firstProduct.featured_asset).toBeNull();
      expect(firstProduct.og_image_asset).toBeNull();
    } finally {
      await server.close();
    }
  });

  it("rejects malformed feature_list payloads", async () => {
    const user = createTestUser();
    const token = createAuthToken(user);
    const server = await startApiTestServer({
      product: {
        create: async () => {
          throw new Error("product.create should not be reached for invalid JSON.");
        },
      },
      user: {
        findUnique: async () => user,
      },
    });

    try {
      const response = await server.request("/api/products", {
        body: {
          feature_list: "{broken-json}",
          name: "Control Panel Retrofit",
        },
        method: "POST",
        token,
      });
      const payload = getJsonObject(response, "invalid feature list");

      expect(response.status).toBe(400);
      expect(payload.error).toBe("feature_list must be valid JSON.");
    } finally {
      await server.close();
    }
  });

  it("maps duplicate product slugs to a 409 conflict", async () => {
    const user = createTestUser();
    const token = createAuthToken(user);
    const server = await startApiTestServer({
      product: {
        create: async () => {
          throw createPrismaKnownRequestError("P2002", ["slug"]);
        },
      },
      user: {
        findUnique: async () => user,
      },
    });

    try {
      const response = await server.request("/api/products", {
        body: {
          name: "Duplicate Product",
          slug: "duplicate-product",
        },
        method: "POST",
        token,
      });
      const payload = getJsonObject(response, "duplicate product");

      expect(response.status).toBe(409);
      expect(payload.error).toBe("Duplicate value for slug.");
    } finally {
      await server.close();
    }
  });

  it("returns 404 when a product does not exist", async () => {
    const server = await startApiTestServer({
      product: {
        findUnique: async () => null,
      },
    });

    try {
      const response = await server.request("/api/products/999");
      const payload = getJsonObject(response, "missing product");

      expect(response.status).toBe(404);
      expect(payload.error).toBe("Product not found.");
    } finally {
      await server.close();
    }
  });
});
