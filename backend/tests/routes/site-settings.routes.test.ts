import { describe, expect, it } from "bun:test";

import {
  createAuthToken,
  createTestUser,
  getJsonObject,
  startApiTestServer,
} from "../helpers/api-test-helpers";

function createSiteSettingsRecord(
  overrides: Partial<{
    address: string | null;
    canonicalBaseUrl: string | null;
    companyName: string;
    companySummary: string | null;
    createdAt: Date;
    defaultOgImageAsset: null;
    defaultOgImageAssetId: number | null;
    email: string | null;
    footerMotto: string | null;
    footerProductLinks: unknown;
    footerQuickLinks: unknown;
    footerSummary: string | null;
    footerTagline: string | null;
    id: number;
    logoAsset: null;
    logoAssetId: number | null;
    metaDescription: string | null;
    metaTitle: string | null;
    phone: string | null;
    siteTagline: string | null;
    socialLinks: unknown;
    updatedAt: Date;
    whatsappLink: string | null;
    whatsappNumber: string | null;
  }> = {},
) {
  return {
    address: null,
    canonicalBaseUrl: null,
    companyName: "CP Automation",
    companySummary: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    defaultOgImageAsset: null,
    defaultOgImageAssetId: null,
    email: null,
    footerMotto: null,
    footerProductLinks: null,
    footerQuickLinks: null,
    footerSummary: null,
    footerTagline: null,
    id: 1,
    logoAsset: null,
    logoAssetId: null,
    metaDescription: null,
    metaTitle: null,
    phone: null,
    siteTagline: null,
    socialLinks: null,
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    whatsappLink: null,
    whatsappNumber: null,
    ...overrides,
  };
}

describe("site settings routes", () => {
  it("requires company_name when creating the singleton for the first time", async () => {
    const user = createTestUser();
    const token = createAuthToken(user);
    const server = await startApiTestServer({
      siteSettings: {
        findUnique: async () => null,
      },
      user: {
        findUnique: async () => user,
      },
    });

    try {
      const response = await server.request("/api/site-settings", {
        body: {
          phone: "+2348000000000",
        },
        method: "PUT",
        token,
      });
      const payload = getJsonObject(response, "site settings create validation");

      expect(response.status).toBe(400);
      expect(payload.error).toBe("company_name is required.");
    } finally {
      await server.close();
    }
  });

  it("creates the singleton once and updates it on later writes", async () => {
    const user = createTestUser();
    const token = createAuthToken(user);
    let currentSettings: ReturnType<typeof createSiteSettingsRecord> | null = null;
    let createCalls = 0;
    let updateCalls = 0;
    const server = await startApiTestServer({
      siteSettings: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          createCalls += 1;
          currentSettings = createSiteSettingsRecord({
            canonicalBaseUrl: (data.canonicalBaseUrl as string | null | undefined) ?? null,
            companyName: String(data.companyName),
            email: (data.email as string | null | undefined) ?? null,
            phone: (data.phone as string | null | undefined) ?? null,
            updatedAt: new Date("2026-04-07T10:00:00.000Z"),
          });

          return currentSettings;
        },
        findUnique: async () => currentSettings,
        update: async ({ data }: { data: Record<string, unknown> }) => {
          updateCalls += 1;
          currentSettings = createSiteSettingsRecord({
            ...(currentSettings || {}),
            canonicalBaseUrl:
              data.canonicalBaseUrl !== undefined
                ? ((data.canonicalBaseUrl as string | null) ?? null)
                : (currentSettings?.canonicalBaseUrl ?? null),
            companyName:
              data.companyName !== undefined
                ? String(data.companyName)
                : (currentSettings?.companyName ?? "CP Automation"),
            email:
              data.email !== undefined
                ? ((data.email as string | null) ?? null)
                : (currentSettings?.email ?? null),
            phone:
              data.phone !== undefined
                ? ((data.phone as string | null) ?? null)
                : (currentSettings?.phone ?? null),
            updatedAt: new Date("2026-04-07T11:00:00.000Z"),
          });

          return currentSettings;
        },
      },
      user: {
        findUnique: async () => user,
      },
    });

    try {
      const createResponse = await server.request("/api/site-settings", {
        body: {
          canonical_base_url: "https://cpautomation.example.com",
          company_name: "CP Automation",
          email: "hello@cpautomation.example.com",
        },
        method: "PUT",
        token,
      });
      const createPayload = getJsonObject(createResponse, "site settings create");

      expect(createResponse.status).toBe(200);
      expect(createPayload.company_name).toBe("CP Automation");
      expect(createPayload.email).toBe("hello@cpautomation.example.com");

      const updateResponse = await server.request("/api/site-settings", {
        body: {
          phone: "+2348000000000",
        },
        method: "PUT",
        token,
      });
      const updatePayload = getJsonObject(updateResponse, "site settings update");

      expect(updateResponse.status).toBe(200);
      expect(updatePayload.phone).toBe("+2348000000000");

      const publicResponse = await server.request("/api/site-settings");
      const publicPayload = getJsonObject(publicResponse, "site settings public lookup");

      expect(publicResponse.status).toBe(200);
      expect(publicPayload.company_name).toBe("CP Automation");
      expect(publicPayload.phone).toBe("+2348000000000");
      expect(createCalls).toBe(1);
      expect(updateCalls).toBe(1);
    } finally {
      await server.close();
    }
  });
});
