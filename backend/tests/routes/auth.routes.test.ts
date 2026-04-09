import { describe, expect, it } from "bun:test";
import bcryptjs from "bcryptjs";

import {
  createAuthToken,
  createTestUser,
  getJsonObject,
  startApiTestServer,
} from "../helpers/api-test-helpers";

describe("auth routes", () => {
  it("rejects invalid login attempts with a generic 401 response", async () => {
    const user = createTestUser({
      passwordHash: await bcryptjs.hash("CorrectPassword123!", 12),
    });
    const server = await startApiTestServer({
      user: {
        findFirst: async () => user,
      },
    });

    try {
      const response = await server.request("/api/auth/login", {
        body: {
          password: "WrongPassword123!",
          username: user.username,
        },
        method: "POST",
      });
      const payload = getJsonObject(response, "invalid login");

      expect(response.status).toBe(401);
      expect(payload.error).toBe("Invalid credentials.");
    } finally {
      await server.close();
    }
  });

  it("keeps forgot-password responses generic when no account matches", async () => {
    const server = await startApiTestServer({
      user: {
        findFirst: async () => null,
      },
    });

    try {
      const response = await server.request("/api/auth/forgot-password", {
        body: {
          identifier: "missing-user",
        },
        method: "POST",
      });
      const payload = getJsonObject(response, "forgot password");

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.message).toBe(
        "If an active account matches that email or username, a reset link has been prepared.",
      );
      expect(payload.debug_reset_url).toBeUndefined();
    } finally {
      await server.close();
    }
  });

  it("returns a debug reset url and invalidates prior reset tokens for matching accounts", async () => {
    const user = createTestUser();
    const resetTokenCreates: Array<Record<string, unknown>> = [];
    const resetTokenUpdates: Array<Record<string, unknown>> = [];
    const server = await startApiTestServer({
      passwordResetToken: {
        create: async (args: Record<string, unknown>) => {
          resetTokenCreates.push(args);
          return {
            id: 1,
          };
        },
        updateMany: async (args: Record<string, unknown>) => {
          resetTokenUpdates.push(args);
          return { count: 1 };
        },
      },
      user: {
        findFirst: async () => user,
      },
    });

    try {
      const response = await server.request("/api/auth/forgot-password", {
        body: {
          identifier: user.email,
        },
        method: "POST",
      });
      const payload = getJsonObject(response, "matched forgot password");

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.message).toBe(
        "If an active account matches that email or username, a reset link has been prepared.",
      );
      expect(typeof payload.debug_reset_url).toBe("string");
      expect(typeof payload.debug_verification_code).toBe("string");
      expect(String(payload.debug_reset_url)).toContain("/admin/reset-password.html?token=");
      expect(String(payload.debug_verification_code)).toMatch(/^\d{6}$/);
      expect(resetTokenUpdates).toHaveLength(1);
      expect(resetTokenCreates).toHaveLength(1);

      const createCall = resetTokenCreates[0];
      const updateCall = resetTokenUpdates[0];

      if (!createCall || !updateCall) {
        throw new Error("Expected forgot-password to record reset-token create and update calls.");
      }

      const createData = createCall.data as Record<string, unknown>;
      const updateWhere = updateCall.where as Record<string, unknown>;

      expect(createData.userId).toBe(user.id);
      expect(typeof createData.tokenHash).toBe("string");
      expect(typeof createData.verificationCodeHash).toBe("string");
      expect(updateWhere.userId).toBe(user.id);
      expect(updateWhere.usedAt).toBeNull();
    } finally {
      await server.close();
    }
  });

  it("accepts a valid verification code before password reset", async () => {
    const user = createTestUser();
    const server = await startApiTestServer({
      passwordResetToken: {
        findFirst: async () => ({
          createdAt: new Date("2026-04-08T10:00:00.000Z"),
          expiresAt: new Date("2026-12-31T00:00:00.000Z"),
          tokenHash: "hashed-token",
          usedAt: null,
          user,
          userId: user.id,
          verificationCodeHash: "hashed-code",
        }),
      },
    });

    try {
      const response = await server.request("/api/auth/verify-reset-code", {
        body: {
          code: "123456",
          identifier: user.email,
        },
        method: "POST",
      });
      const payload = getJsonObject(response, "verify reset code");

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.message).toBe("Verification code accepted. Continue to set a new password.");
    } finally {
      await server.close();
    }
  });

  it("rejects expired reset tokens", async () => {
    const user = createTestUser({
      passwordHash: await bcryptjs.hash("CurrentPassword123!", 12),
    });
    const server = await startApiTestServer({
      passwordResetToken: {
        findUnique: async () => ({
          expiresAt: new Date("2026-01-01T00:00:00.000Z"),
          tokenHash: "expired",
          usedAt: null,
          user,
          userId: user.id,
        }),
      },
    });

    try {
      const response = await server.request("/api/auth/reset-password", {
        body: {
          password: "AnotherPassword123!",
          token: "expired-token",
        },
        method: "POST",
      });
      const payload = getJsonObject(response, "expired reset password");

      expect(response.status).toBe(400);
      expect(payload.error).toBe("Password reset link is invalid or has expired.");
    } finally {
      await server.close();
    }
  });

  it("rejects reset tokens that have already been used", async () => {
    const user = createTestUser({
      passwordHash: await bcryptjs.hash("CurrentPassword123!", 12),
    });
    const server = await startApiTestServer({
      passwordResetToken: {
        findUnique: async () => ({
          expiresAt: new Date("2026-12-31T00:00:00.000Z"),
          tokenHash: "used",
          usedAt: new Date("2026-04-08T09:00:00.000Z"),
          user,
          userId: user.id,
        }),
      },
    });

    try {
      const response = await server.request("/api/auth/reset-password", {
        body: {
          password: "AnotherPassword123!",
          token: "used-token",
        },
        method: "POST",
      });
      const payload = getJsonObject(response, "used reset password");

      expect(response.status).toBe(400);
      expect(payload.error).toBe("Password reset link is invalid or has expired.");
    } finally {
      await server.close();
    }
  });

  it("invalidates the old token after password change and accepts the new token", async () => {
    let currentUser = createTestUser({
      passwordHash: await bcryptjs.hash("CurrentPassword123!", 12),
      passwordChangedAt: null,
    });
    const resetTokenUpdates: Array<Record<string, unknown>> = [];
    const server = await startApiTestServer({
      $transaction: async (
        callback: (tx: {
          passwordResetToken: {
            updateMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
          };
          user: {
            update: (args: {
              data: Partial<typeof currentUser>;
              where: {
                id: number;
              };
            }) => Promise<typeof currentUser>;
          };
        }) => Promise<unknown>,
      ) =>
        callback({
          passwordResetToken: {
            updateMany: async (args) => {
              resetTokenUpdates.push(args);
              return { count: 1 };
            },
          },
          user: {
            update: async ({ data }) => {
              currentUser = {
                ...currentUser,
                ...data,
                updatedAt: new Date("2026-04-07T12:00:00.500Z"),
              };

              return currentUser;
            },
          },
        }),
      passwordResetToken: {
        updateMany: async () => ({ count: 0 }),
      },
      user: {
        findUnique: async () => currentUser,
      },
    });

    try {
      const oldToken = createAuthToken(currentUser);
      const changePasswordResponse = await server.request("/api/auth/change-password", {
        body: {
          current_password: "CurrentPassword123!",
          new_password: "BrandNewPassword123!",
        },
        method: "POST",
        token: oldToken,
      });
      const changePasswordPayload = getJsonObject(changePasswordResponse, "change password");

      expect(changePasswordResponse.status).toBe(200);
      expect(changePasswordPayload.message).toBe("Password changed successfully.");
      expect(typeof changePasswordPayload.token).toBe("string");
      expect(resetTokenUpdates).toHaveLength(1);

      const oldTokenMeResponse = await server.request("/api/auth/me", {
        token: oldToken,
      });
      const oldTokenPayload = getJsonObject(oldTokenMeResponse, "old auth token");

      expect(oldTokenMeResponse.status).toBe(401);
      expect(oldTokenPayload.error).toBe("Token is no longer valid.");

      const newTokenMeResponse = await server.request("/api/auth/me", {
        token: String(changePasswordPayload.token),
      });
      const newTokenPayload = getJsonObject(newTokenMeResponse, "new auth token");
      const meUser = newTokenPayload.user as Record<string, unknown>;

      expect(newTokenMeResponse.status).toBe(200);
      expect(meUser.username).toBe(currentUser.username);
      expect(currentUser.passwordChangedAt).toBeInstanceOf(Date);
    } finally {
      await server.close();
    }
  });

  it("resets the password with an identifier and verification code", async () => {
    let currentUser = createTestUser({
      passwordHash: await bcryptjs.hash("CurrentPassword123!", 12),
      passwordChangedAt: null,
    });
    const resetTokenUpdates: Array<Record<string, unknown>> = [];
    const server = await startApiTestServer({
      $transaction: async (
        callback: (tx: {
          passwordResetToken: {
            updateMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
          };
          user: {
            update: (args: {
              data: Partial<typeof currentUser>;
              where: {
                id: number;
              };
            }) => Promise<typeof currentUser>;
          };
        }) => Promise<unknown>,
      ) =>
        callback({
          passwordResetToken: {
            updateMany: async (args) => {
              resetTokenUpdates.push(args);
              return { count: 1 };
            },
          },
          user: {
            update: async ({ data }) => {
              currentUser = {
                ...currentUser,
                ...data,
                updatedAt: new Date("2026-04-08T12:00:00.500Z"),
              };

              return currentUser;
            },
          },
        }),
      passwordResetToken: {
        findFirst: async () => ({
          createdAt: new Date("2026-04-08T11:00:00.000Z"),
          expiresAt: new Date("2026-12-31T00:00:00.000Z"),
          tokenHash: "hashed-token",
          usedAt: null,
          user: currentUser,
          userId: currentUser.id,
          verificationCodeHash: "hashed-code",
        }),
        updateMany: async () => ({ count: 0 }),
      },
      user: {
        findUnique: async () => currentUser,
      },
    });

    try {
      const response = await server.request("/api/auth/reset-password", {
        body: {
          code: "123456",
          identifier: currentUser.email,
          password: "BrandNewPassword123!",
        },
        method: "POST",
      });
      const payload = getJsonObject(response, "reset password by code");

      expect(response.status).toBe(200);
      expect(payload.message).toBe("Password reset successful.");
      expect(typeof payload.token).toBe("string");
      expect(resetTokenUpdates).toHaveLength(1);
      expect(currentUser.passwordChangedAt).toBeInstanceOf(Date);
    } finally {
      await server.close();
    }
  });

  it("updates the recovery email from the authenticated dashboard flow", async () => {
    let currentUser = createTestUser({
      email: "admin@example.com",
      passwordHash: await bcryptjs.hash("CurrentPassword123!", 12),
    });
    const server = await startApiTestServer({
      user: {
        findUnique: async () => currentUser,
        update: async ({ data }: { data: Partial<typeof currentUser> }) => {
          currentUser = {
            ...currentUser,
            ...data,
            updatedAt: new Date("2026-04-08T12:15:00.000Z"),
          };

          return currentUser;
        },
      },
    });

    try {
      const response = await server.request("/api/auth/change-email", {
        body: {
          current_password: "CurrentPassword123!",
          email: "new-admin@example.com",
        },
        method: "POST",
        token: createAuthToken(currentUser),
      });
      const payload = getJsonObject(response, "change email");
      const user = payload.user as Record<string, unknown>;

      expect(response.status).toBe(200);
      expect(payload.message).toBe("Recovery email updated successfully.");
      expect(typeof payload.token).toBe("string");
      expect(user.email).toBe("new-admin@example.com");
    } finally {
      await server.close();
    }
  });
});
