const { test, expect } = require("@playwright/test");

const { API_ROOT, createPublicApiHandlers, jsonResponse, mockApi } = require("../helpers/mock-api");
const { buildPublicContent } = require("../helpers/test-data");

test.describe("Public site", () => {
  test("renders API-driven homepage content, updates metadata, and hides draft items", async ({
    page,
  }) => {
    const publicContent = buildPublicContent({
      aboutPage: {
        founder_name: "Amina Rowland",
      },
      homePage: {
        hero_heading:
          "Automation that keeps high-pressure systems running with less manual effort.",
        hero_primary_cta_label: "Book a site review",
        hero_primary_cta_url: "https://example.com/book-a-site-review",
        meta_description:
          "Live API content for the homepage should update the meta description as soon as content loads.",
        meta_title: "Live API Homepage Title | CP Automation",
      },
      siteSettings: {
        canonical_base_url: "https://cpautomation.example/live-home",
        company_name: "CP Automation Live",
        site_tagline: "Operationally dependable automation",
      },
    });

    await mockApi(page, createPublicApiHandlers(publicContent));

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Automation that keeps high-pressure systems running with less manual effort.",
      }),
    ).toBeVisible();
    await expect(page.locator("#brandName")).toHaveText("CP Automation Live");
    await expect(page.locator(".hero-primary-cta")).toHaveAttribute(
      "href",
      "https://example.com/book-a-site-review",
    );
    await expect(page.locator("#productsGrid")).toContainText("Pump Control Panel");
    await expect(page.locator("#productsGrid")).not.toContainText("Hidden Draft Product");
    await expect(page).toHaveTitle("Live API Homepage Title | CP Automation");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Live API content for the homepage should update the meta description as soon as content loads.",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://cpautomation.example/live-home",
    );

    await page.locator('.navbar-nav .nav-link[href="#contact"]').click();
    await expect
      .poll(() =>
        page.evaluate(() => document.querySelector("#contact").getBoundingClientRect().top),
      )
      .toBeLessThan(200);
  });

  test("falls back gracefully to bundled default content when the API fails", async ({ page }) => {
    await page.route(`${API_ROOT}/**`, async (route) => {
      await route.fulfill(
        jsonResponse(
          {
            error: "Simulated API outage",
          },
          { status: 500 },
        ),
      );
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Reduce manual supervision across water, power, lighting, and custom control workflows.",
      }),
    ).toBeVisible();
    await expect(page.locator("#brandName")).toHaveText("CP Automation");
    await expect(page.locator("#productsGrid")).toContainText("CP Level Controller");
    await expect(page.locator("#contactSectionContent")).toContainText(
      "Need a system that runs with less manual attention?",
    );
  });

  test("keeps fallback singleton content for failed endpoints while rendering live content elsewhere", async ({
    page,
  }) => {
    const publicContent = buildPublicContent({
      homePage: {
        hero_heading: "Live hero content should still render during a partial API outage.",
      },
      siteSettings: {
        company_name: "This should not render because site settings fail.",
      },
    });

    await mockApi(page, {
      ...createPublicApiHandlers(publicContent),
      "GET /site-settings": jsonResponse(
        {
          error: "Simulated site settings failure",
        },
        { status: 500 },
      ),
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Live hero content should still render during a partial API outage.",
      }),
    ).toBeVisible();
    await expect(page.locator("#brandName")).toHaveText("CP Automation");
    await expect(page.locator("#productsGrid")).toContainText("Pump Control Panel");
  });

  test("serves the public shell on rewritten marketing routes", async ({ page }) => {
    await mockApi(page, createPublicApiHandlers(buildPublicContent()));

    await page.goto("/about", { waitUntil: "domcontentloaded" });

    await expect(page.locator("#brandName")).toHaveText("CP Automation");
    await expect(page.locator("#aboutHeroContent")).toContainText("About CP Automation");
    await expect(page.locator("#aboutProfileContent")).toContainText("Rita Okafor");
  });

  test("serves the dedicated projects page with pagination-ready content", async ({ page }) => {
    const publicContent = buildPublicContent({
      projects: Array.from({ length: 7 }, (_, index) => ({
        description: `Project description ${index + 1}`,
        image_asset: null,
        is_published: true,
        location: `Location ${index + 1}`,
        order_index: index + 1,
        slug: `project-${index + 1}`,
        title: `Project ${index + 1}`,
      })),
    });

    await mockApi(page, createPublicApiHandlers(publicContent));

    await page.goto("/projects", { waitUntil: "domcontentloaded" });

    await expect(page.locator("#projectsListingContent")).toContainText("Project 1");
    await expect(page.locator("#projectsListingContent")).toContainText("Project 6");
    await expect(page.locator("#projectsListingContent")).not.toContainText("Project 7");
    await page.getByRole("button", { name: "2" }).click();
    await expect(page.locator("#projectsListingContent")).toContainText("Project 7");
  });
});
