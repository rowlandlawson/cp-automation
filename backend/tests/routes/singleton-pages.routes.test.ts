import { describe, expect, it } from "bun:test";

import {
  createAuthToken,
  createTestUser,
  getJsonObject,
  startApiTestServer,
} from "../helpers/api-test-helpers";

describe("singleton page routes", () => {
  describe("home page routes", () => {
    it("requires hero_heading when creating the singleton for the first time", async () => {
      const user = createTestUser();
      const token = createAuthToken(user);
      const server = await startApiTestServer({
        homePage: {
          findUnique: async () => null,
        },
        user: {
          findUnique: async () => user,
        },
      });

      try {
        const response = await server.request("/api/home-page", {
          body: {
            hero_subheading: "Missing the required heading.",
          },
          method: "PUT",
          token,
        });
        const payload = getJsonObject(response, "home page create validation");

        expect(response.status).toBe(400);
        expect(payload.error).toBe("hero_heading is required.");
      } finally {
        await server.close();
      }
    });

    it("rejects malformed home-page JSON payloads", async () => {
      const user = createTestUser();
      const token = createAuthToken(user);
      const server = await startApiTestServer({
        homePage: {
          create: async () => {
            throw new Error("homePage.create should not be reached for invalid JSON.");
          },
          findUnique: async () => null,
        },
        user: {
          findUnique: async () => user,
        },
      });

      try {
        const response = await server.request("/api/home-page", {
          body: {
            hero_heading: "Automation heading",
            hero_stats: "{broken-json}",
          },
          method: "PUT",
          token,
        });
        const payload = getJsonObject(response, "invalid home page json");

        expect(response.status).toBe(400);
        expect(payload.error).toBe("hero_stats must be valid JSON.");
      } finally {
        await server.close();
      }
    });
  });

  describe("about page routes", () => {
    it("requires founder_name when creating the singleton for the first time", async () => {
      const user = createTestUser();
      const token = createAuthToken(user);
      const server = await startApiTestServer({
        aboutPage: {
          findUnique: async () => null,
        },
        user: {
          findUnique: async () => user,
        },
      });

      try {
        const response = await server.request("/api/about-page", {
          body: {
            mission: "Missing founder name.",
          },
          method: "PUT",
          token,
        });
        const payload = getJsonObject(response, "about page create validation");

        expect(response.status).toBe(400);
        expect(payload.error).toBe("founder_name is required.");
      } finally {
        await server.close();
      }
    });

    it("rejects malformed about-page JSON payloads", async () => {
      const user = createTestUser();
      const token = createAuthToken(user);
      const server = await startApiTestServer({
        aboutPage: {
          create: async () => {
            throw new Error("aboutPage.create should not be reached for invalid JSON.");
          },
          findUnique: async () => null,
        },
        user: {
          findUnique: async () => user,
        },
      });

      try {
        const response = await server.request("/api/about-page", {
          body: {
            founder_name: "Rowland Example",
            values: "{broken-json}",
          },
          method: "PUT",
          token,
        });
        const payload = getJsonObject(response, "invalid about page json");

        expect(response.status).toBe(400);
        expect(payload.error).toBe("values must be valid JSON.");
      } finally {
        await server.close();
      }
    });
  });
});
