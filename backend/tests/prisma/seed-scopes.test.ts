import { describe, expect, it } from "bun:test";

import { parseSeedScopes, resolveSeedScopes } from "../../prisma/seeds";

describe("seed scope orchestration", () => {
  it("defaults to all scopes when no scope is provided", () => {
    expect(parseSeedScopes([])).toEqual([
      "admin",
      "media",
      "site-settings",
      "home-page",
      "about-page",
      "products",
      "services",
      "projects",
      "testimonials",
      "page-sections",
      "content-sections",
    ]);
  });

  it("normalizes comma-separated and underscored scope arguments", () => {
    expect(parseSeedScopes(["--scope=site_settings,content sections"])).toEqual([
      "site-settings",
      "content-sections",
    ]);
  });

  it("resolves media seed dependencies in execution order", () => {
    expect(resolveSeedScopes(["media"])).toEqual(["admin", "media"]);
  });

  it("resolves singleton and project dependencies without duplicates", () => {
    expect(resolveSeedScopes(["site-settings", "projects"])).toEqual([
      "admin",
      "media",
      "site-settings",
      "projects",
    ]);
  });

  it("keeps independent scopes in canonical execution order", () => {
    expect(resolveSeedScopes(["testimonials", "products", "content-sections"])).toEqual([
      "admin",
      "products",
      "testimonials",
      "content-sections",
    ]);
  });
});
