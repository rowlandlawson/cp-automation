const { test, expect } = require("@playwright/test");

const { createAdminOverviewHandlers, jsonResponse, mockApi } = require("../helpers/mock-api");
const { buildAdminOverviewData, buildAdminUser } = require("../helpers/test-data");

test.describe("Admin dashboard navigation", () => {
  test("keeps sidebar links available after navigation on compact screens", async ({
    page,
  }) => {
    const authUser = buildAdminUser({
      username: "mobile-nav-admin",
    });

    await mockApi(page, {
      ...createAdminOverviewHandlers(buildAdminOverviewData()),
      "GET /auth/me": jsonResponse({
        user: authUser,
      }),
    });

    await page.addInitScript(
      ({ token, user }) => {
        window.localStorage.setItem("adminToken", token);
        window.localStorage.setItem("adminUser", JSON.stringify(user));
      },
      { token: "mobile-nav-token", user: authUser },
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/index.html#overview", { waitUntil: "domcontentloaded" });

    const body = page.locator("body");
    const settingsLink = page.locator('[data-page="site-settings"]');
    const projectsLink = page.locator('[data-page="projects"]');

    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await expect(body).toHaveClass(/sidebar-open/);
    await expect(settingsLink).toBeVisible();
    await expect(projectsLink).toBeVisible();

    await settingsLink.click();

    await expect(page).toHaveURL(/#site-settings$/);
    await expect(page.locator("#pageTitle")).toHaveText("Settings");
    await expect(page.getByRole("button", { name: "Save settings" })).toBeVisible();
    await expect(body).toHaveClass(/sidebar-open/);
    await expect(projectsLink).toBeVisible();
  });
});
