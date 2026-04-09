import { describe, expect, it } from "bun:test";

import {
  createAuthToken,
  createPrismaKnownRequestError,
  createTestUser,
  getJsonObject,
  startApiTestServer,
} from "../helpers/api-test-helpers";

function createContentSectionRecord(
  overrides: Partial<{
    content: string | null;
    createdAt: Date;
    id: number;
    sectionName: string;
    updatedAt: Date;
    updatedBy: number | null;
  }> = {},
) {
  return {
    content: "Legacy footer copy.",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    id: 7,
    sectionName: "footer",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedBy: 1,
    ...overrides,
  };
}

describe("content routes", () => {
  it("returns the expected public content-section contract", async () => {
    const section = createContentSectionRecord();
    const server = await startApiTestServer({
      contentSection: {
        findUnique: async () => section,
      },
    });

    try {
      const response = await server.request("/api/content/section/footer");
      const payload = getJsonObject(response, "public content section");

      expect(response.status).toBe(200);
      expect(payload.section_name).toBe(section.sectionName);
      expect(payload.content).toBe(section.content);
      expect(payload.updated_by).toBe(section.updatedBy);
    } finally {
      await server.close();
    }
  });

  it("requires section_name when creating a content section", async () => {
    const user = createTestUser();
    const token = createAuthToken(user);
    const server = await startApiTestServer({
      contentSection: {
        create: async () => {
          throw new Error("contentSection.create should not be reached for invalid input.");
        },
      },
      user: {
        findUnique: async () => user,
      },
    });

    try {
      const response = await server.request("/api/content", {
        body: {
          content: "Missing section name.",
        },
        method: "POST",
        token,
      });
      const payload = getJsonObject(response, "invalid content section");

      expect(response.status).toBe(400);
      expect(payload.error).toBe("section_name is required.");
    } finally {
      await server.close();
    }
  });

  it("maps duplicate content section names to a 409 conflict", async () => {
    const user = createTestUser();
    const token = createAuthToken(user);
    const server = await startApiTestServer({
      contentSection: {
        create: async () => {
          throw createPrismaKnownRequestError("P2002", ["sectionName"]);
        },
      },
      user: {
        findUnique: async () => user,
      },
    });

    try {
      const response = await server.request("/api/content", {
        body: {
          content: "Duplicate body.",
          section_name: "footer",
        },
        method: "POST",
        token,
      });
      const payload = getJsonObject(response, "duplicate content section");

      expect(response.status).toBe(409);
      expect(payload.error).toBe("Duplicate value for sectionName.");
    } finally {
      await server.close();
    }
  });

  it("returns 404 when a content section does not exist", async () => {
    const server = await startApiTestServer({
      contentSection: {
        findUnique: async () => null,
      },
    });

    try {
      const response = await server.request("/api/content/999");
      const payload = getJsonObject(response, "missing content section");

      expect(response.status).toBe(404);
      expect(payload.error).toBe("Content section not found.");
    } finally {
      await server.close();
    }
  });
});
