const { test, expect } = require("@playwright/test");

const { createPublicApiHandlers, jsonResponse, mockApi } = require("../helpers/mock-api");
const { buildAboutPage, buildAdminUser, buildPublicContent } = require("../helpers/test-data");

test.describe("Admin content editing", () => {
  test("updates the About page and the new founder profile appears on the public site", async ({
    page,
  }) => {
    const authUser = buildAdminUser({
      username: "content-admin",
    });

    let currentAboutPage = buildAboutPage({
      founder_name: "Rita Okafor",
      founder_role: "Founder & Lead Automation Specialist",
      portrait_asset: null,
      short_bio:
        "Rita leads founder-led automation delivery across water, power, and custom control workflows.",
    });

    const publicContent = buildPublicContent({
      aboutPage: currentAboutPage,
    });

    await mockApi(page, {
      ...createPublicApiHandlers(publicContent),
      "GET /auth/me": jsonResponse({
        user: authUser,
      }),
      "GET /about-page": () => jsonResponse(currentAboutPage),
      "PUT /about-page": () => {
        currentAboutPage = buildAboutPage({
          certifications: [],
          founder_name: "Chinelo Adebayo",
          founder_role: "Founder & Operations Automation Director",
          portrait_asset: null,
          short_bio:
            "Chinelo leads project scoping, commissioning, and dependable control delivery for high-pressure daily operations.",
        });
        publicContent.aboutPage = currentAboutPage;
        return jsonResponse(currentAboutPage);
      },
    });

    await page.addInitScript(
      ({ token, user }) => {
        window.localStorage.setItem("adminToken", token);
        window.localStorage.setItem("adminUser", JSON.stringify(user));
      },
      { token: "content-session-token", user: authUser },
    );

    await page.goto("/admin/index.html#about-page", { waitUntil: "domcontentloaded" });

    await page.getByLabel("Founder / admin name").fill("Chinelo Adebayo");
    await page.getByLabel("Founder / admin role").fill("Founder & Operations Automation Director");
    await page
      .getByLabel("Short bio")
      .fill(
        "Chinelo leads project scoping, commissioning, and dependable control delivery for high-pressure daily operations.",
      );
    await page.getByRole("button", { name: "Save about page" }).click();

    await expect(page.locator("#alertContainer")).toContainText(
      "About page content updated successfully.",
    );
    await expect(page.locator("#aboutPagePreview")).toContainText("Chinelo Adebayo");

    await page.goto("/about", { waitUntil: "domcontentloaded" });

    await expect(page.locator("#aboutProfileContent")).toContainText("Chinelo Adebayo");
    await expect(page.locator("#aboutProfileContent")).toContainText(
      "Founder & Operations Automation Director",
    );
    await expect(page.locator("#aboutProfileContent")).toContainText(
      "dependable control delivery for high-pressure daily operations",
    );
  });
});
