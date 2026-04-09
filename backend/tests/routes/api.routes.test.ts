import { describe, expect, it } from "bun:test";

import { getJsonObject, startApiTestServer } from "../helpers/api-test-helpers";

describe("api routes", () => {
  it("rejects unauthenticated admin routes with 401", async () => {
    const server = await startApiTestServer({});

    try {
      const response = await server.request("/api/products/admin/all");
      const payload = getJsonObject(response, "unauthenticated admin route");

      expect(response.status).toBe(401);
      expect(payload.error).toBe("No token provided.");
    } finally {
      await server.close();
    }
  });

  it("returns a JSON 404 payload for unknown routes", async () => {
    const server = await startApiTestServer({});

    try {
      const response = await server.request("/api/not-a-real-route");
      const payload = getJsonObject(response, "unknown api route");

      expect(response.status).toBe(404);
      expect(payload.error).toBe("Route GET /api/not-a-real-route was not found.");
    } finally {
      await server.close();
    }
  });
});
