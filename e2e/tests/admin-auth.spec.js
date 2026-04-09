const { test, expect } = require("@playwright/test");

const { createAdminOverviewHandlers, jsonResponse, mockApi } = require("../helpers/mock-api");
const {
  buildAdminOverviewData,
  buildAdminUser,
  buildAuthResponse,
} = require("../helpers/test-data");

test.describe("Admin authentication and recovery", () => {
  test("redirects bare /admin visits to the admin login screen", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await page.waitForURL(/\/admin\/login\.html\?message=/, {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Admin Sign In",
      }),
    ).toBeVisible();
  });

  test("rejects invalid login cleanly", async ({ page }) => {
    const loginAttempts = [];

    await mockApi(page, {
      "POST /auth/login": ({ body }) => {
        loginAttempts.push(body);
        return jsonResponse(
          {
            error: "Invalid credentials.",
          },
          { status: 401 },
        );
      },
    });

    await page.goto("/admin/login.html");

    await page.getByLabel("Username").fill("wrong-user");
    await page.getByLabel("Password").fill("WrongPassword!234");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator("#loginError")).toContainText("Invalid credentials.");
    expect(loginAttempts).toEqual([
      {
        password: "WrongPassword!234",
        username: "wrong-user",
      },
    ]);
  });

  test("signs in successfully and renders the dashboard overview", async ({ page }) => {
    const authResponse = buildAuthResponse({
      token: "phase3-login-token",
      user: {
        username: "control-room-admin",
      },
    });

    await mockApi(page, {
      ...createAdminOverviewHandlers(buildAdminOverviewData()),
      "GET /auth/me": jsonResponse({
        user: authResponse.user,
      }),
      "POST /auth/login": jsonResponse(authResponse),
    });

    await page.goto("/admin/login.html", { waitUntil: "domcontentloaded" });

    await page.getByLabel("Username").fill("control-room-admin");
    await page.getByLabel("Password").fill("CorrectPassword!234");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/admin\/index\.html$/);
    await expect(page.locator("#pageTitle")).toHaveText("Overview");
    await expect(page.locator("#sessionUser")).toHaveText("control-room-admin");
    await expect(page.locator("#contentArea")).toContainText(
      "Manage the core information that now drives the public site.",
    );
  });

  test("restores an existing session and clears it again on logout", async ({ page }) => {
    const restoredUser = buildAdminUser({
      username: "restored-admin",
    });
    const meHeaders = [];

    await mockApi(page, {
      ...createAdminOverviewHandlers(buildAdminOverviewData()),
      "GET /auth/me": ({ request }) => {
        meHeaders.push(request.headers().authorization);
        return jsonResponse({
          user: restoredUser,
        });
      },
    });

    await page.goto("/admin/login.html", { waitUntil: "domcontentloaded" });
    await page.evaluate(
      ({ token, user }) => {
        window.localStorage.setItem("adminToken", token);
        window.localStorage.setItem("adminUser", JSON.stringify(user));
      },
      { token: "restored-session-token", user: restoredUser },
    );

    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/admin/index.html", { waitUntil: "domcontentloaded" });

    await expect(page.locator("#sessionUser")).toHaveText("restored-admin");
    await expect.poll(() => meHeaders.length).toBe(1);
    expect(meHeaders[0]).toBe("Bearer restored-session-token");

    await page.getByRole("button", { name: "Logout" }).click();

    await page.waitForURL(/\/admin\/login\.html\?message=/, {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Admin Sign In",
      }),
    ).toBeVisible();
    await expect(page.locator("#loginError")).toContainText("You have been signed out.");
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem("adminToken")))
      .toBeNull();
  });

  test("supports forgot-password, reset-password errors, and account password rotation", async ({
    page,
  }) => {
    const restoredUser = buildAdminUser({
      username: "password-admin",
    });
    const meHeaders = [];

    await mockApi(page, {
      "POST /auth/forgot-password": jsonResponse({
        debug_reset_url: "http://127.0.0.1:4173/admin/reset-password.html?token=debug-phase3-token",
        message:
          "If an active account matches that email or username, a reset link has been prepared.",
        success: true,
      }),
      "POST /auth/reset-password": jsonResponse(
        {
          error: "Password reset link is invalid or has expired.",
        },
        { status: 400 },
      ),
      "GET /auth/me": ({ request }) => {
        meHeaders.push(request.headers().authorization);
        return jsonResponse({
          user: restoredUser,
        });
      },
      "POST /auth/change-password": jsonResponse({
        message: "Password changed successfully.",
        token: "fresh-session-token",
        user: restoredUser,
      }),
    });

    await page.goto("/admin/forgot-password.html", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Username or email").fill("password-admin");
    await page.getByRole("button", { name: "Send recovery instructions" }).click();
    await expect(page.locator("#forgotPasswordSuccess")).toContainText(
      "If an active account matches that email or username, a reset link has been prepared.",
    );
    await expect(page.locator("#forgotPasswordDebug a").last()).toHaveAttribute(
      "href",
      "http://127.0.0.1:4173/admin/reset-password.html?token=debug-phase3-token",
    );

    await page.goto("/admin/reset-password.html", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#resetTokenState")).toContainText(
      "This reset page needs either a link token or a verified recovery code.",
    );
    await expect(page.locator("#resetPasswordSubmit")).toBeDisabled();

    await page.goto("/admin/reset-password.html?token=expired-token", {
      waitUntil: "domcontentloaded",
    });
    await page.locator("#newPassword").fill("BrandNewPassword!234");
    await page.locator("#confirmPassword").fill("BrandNewPassword!234");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.locator("#resetPasswordError")).toContainText(
      "Password reset link is invalid or has expired.",
    );

    await page.evaluate(
      ({ token, user }) => {
        window.localStorage.setItem("adminToken", token);
        window.localStorage.setItem("adminUser", JSON.stringify(user));
      },
      { token: "old-session-token", user: restoredUser },
    );

    await page.goto("/admin/index.html#account-settings", {
      waitUntil: "domcontentloaded",
    });
    await page.locator("#currentPassword").fill("OldPassword!234");
    await page.locator("#newPassword").fill("BrandNewPassword!234");
    await page.locator("#confirmNewPassword").fill("BrandNewPassword!234");
    await page.getByRole("button", { name: "Update password" }).click();

    await expect(page.locator("#alertContainer")).toContainText("Password changed successfully.");
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem("adminToken")))
      .toBe("fresh-session-token");

    await page.reload();
    await expect.poll(() => meHeaders.at(-1)).toBe("Bearer fresh-session-token");
  });

  test("logs out when a protected admin request returns 401 after session restore", async ({
    page,
  }) => {
    const restoredUser = buildAdminUser({
      username: "expired-admin",
    });

    await mockApi(page, {
      ...createAdminOverviewHandlers(buildAdminOverviewData()),
      "GET /about-page": jsonResponse(
        {
          error: "Token is no longer valid.",
        },
        { status: 401 },
      ),
      "GET /auth/me": jsonResponse({
        user: restoredUser,
      }),
    });

    await page.goto("/admin/login.html", { waitUntil: "domcontentloaded" });
    await page.evaluate(
      ({ token, user }) => {
        window.localStorage.setItem("adminToken", token);
        window.localStorage.setItem("adminUser", JSON.stringify(user));
      },
      { token: "expired-session-token", user: restoredUser },
    );

    await page.goto("/admin/index.html#about-page", { waitUntil: "domcontentloaded" });

    await page.waitForURL(/\/admin\/login\.html\?message=/, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("#loginError")).toContainText(
      "Your session expired. Please sign in again.",
    );
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem("adminToken")))
      .toBeNull();
  });
});
