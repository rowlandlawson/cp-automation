import { describe, expect, it } from "bun:test";

import {
  createAuthToken,
  createPrismaKnownRequestError,
  createTestUser,
  getJsonObject,
  startApiTestServer,
} from "../helpers/api-test-helpers";

describe("page section routes", () => {
  it("rejects unsupported public page types", async () => {
    const server = await startApiTestServer({
      pageSection: {
        findMany: async () => [],
      },
    });

    try {
      const response = await server.request("/api/page-sections/page/invalid-page");
      const payload = getJsonObject(response, "invalid page type");

      expect(response.status).toBe(400);
      expect(payload.error).toBe("page type must be HOME, ABOUT, or GLOBAL.");
    } finally {
      await server.close();
    }
  });

  it("rejects malformed page-section JSON payloads", async () => {
    const user = createTestUser();
    const token = createAuthToken(user);
    const server = await startApiTestServer({
      pageSection: {
        create: async () => {
          throw new Error("pageSection.create should not be reached for invalid JSON.");
        },
      },
      user: {
        findUnique: async () => user,
      },
    });

    try {
      const response = await server.request("/api/page-sections", {
        body: {
          content: "{not valid json}",
          page_type: "HOME",
          section_key: "hero",
        },
        method: "POST",
        token,
      });
      const payload = getJsonObject(response, "invalid page section content");

      expect(response.status).toBe(400);
      expect(payload.error).toBe("content must be valid JSON.");
    } finally {
      await server.close();
    }
  });

  it("maps duplicate page section keys to a 409 conflict", async () => {
    const user = createTestUser();
    const token = createAuthToken(user);
    const server = await startApiTestServer({
      pageSection: {
        create: async () => {
          throw createPrismaKnownRequestError("P2002", ["pageType", "sectionKey"]);
        },
      },
      user: {
        findUnique: async () => user,
      },
    });

    try {
      const response = await server.request("/api/page-sections", {
        body: {
          page_type: "HOME",
          section_key: "hero",
          title: "Hero",
        },
        method: "POST",
        token,
      });
      const payload = getJsonObject(response, "duplicate page section");

      expect(response.status).toBe(409);
      expect(payload.error).toBe("Duplicate value for pageType, sectionKey.");
    } finally {
      await server.close();
    }
  });

  it("hides unpublished page sections from the public detail endpoint", async () => {
    const server = await startApiTestServer({
      pageSection: {
        findUnique: async () => ({
          id: 15,
          isPublished: false,
        }),
      },
    });

    try {
      const response = await server.request("/api/page-sections/page/HOME/hero");
      const payload = getJsonObject(response, "unpublished page section detail");

      expect(response.status).toBe(404);
      expect(payload.error).toBe("Page section not found.");
    } finally {
      await server.close();
    }
  });
});
