import { afterEach, describe, expect, it } from "bun:test";

import { env } from "../../config/env";
import { deliverPasswordReset } from "../../utils/password-reset";

const originalEnv = {
  ...env,
  CORS_ORIGINS: [...env.CORS_ORIGINS],
};
const originalFetch = globalThis.fetch;

afterEach(() => {
  Object.assign(env, {
    ...originalEnv,
    CORS_ORIGINS: [...originalEnv.CORS_ORIGINS],
  });
  globalThis.fetch = originalFetch;
});

describe("password reset delivery", () => {
  it("sends password reset emails directly through Brevo when configured", async () => {
    const fetchCalls: Array<{
      init?: RequestInit;
      input: Parameters<typeof fetch>[0];
    }> = [];

    Object.assign(env, {
      BREVO_API_KEY: "brevo-key",
      BREVO_REPLY_TO_EMAIL: "support@example.com",
      BREVO_REPLY_TO_NAME: "Support",
      BREVO_SENDER_EMAIL: "no-reply@example.com",
      BREVO_SENDER_NAME: "CP Automation",
      NODE_ENV: "production",
      PASSWORD_RESET_WEBHOOK_URL: "",
    });

    globalThis.fetch = (async (input, init) => {
      fetchCalls.push({ init, input });

      return new Response(JSON.stringify({ messageId: "brevo-message-id" }), {
        headers: {
          "Content-Type": "application/json",
        },
        status: 201,
      });
    }) as typeof fetch;

    const result = await deliverPasswordReset({
      email: "admin@example.com",
      expiresAt: new Date("2026-04-08T12:30:00.000Z"),
      token: "token-123",
      verificationCode: "654321",
      username: "admin",
    });

    expect(result.delivery).toBe("brevo");
    expect(fetchCalls).toHaveLength(1);

    const call = fetchCalls[0];

    if (!call) {
      throw new Error("Expected Brevo fetch call to be recorded.");
    }

    expect(String(call.input)).toBe("https://api.brevo.com/v3/smtp/email");

    const headers = call.init?.headers as Record<string, string>;
    const body = JSON.parse(String(call.init?.body ?? "{}")) as Record<string, unknown>;
    const sender = body.sender as Record<string, unknown>;
    const replyTo = body.replyTo as Record<string, unknown>;
    const recipients = body.to as Array<Record<string, unknown>>;

    expect(headers["api-key"]).toBe("brevo-key");
    expect(sender.email).toBe("no-reply@example.com");
    expect(sender.name).toBe("CP Automation");
    expect(replyTo.email).toBe("support@example.com");
    expect(replyTo.name).toBe("Support");
    expect(recipients[0]?.email).toBe("admin@example.com");
    expect(String(body.subject)).toBe("Reset your CP Automation password");
    expect(String(body.textContent)).toContain("/admin/reset-password.html?token=token-123");
    expect(String(body.textContent)).toContain("Verification code: 654321");
    expect(String(body.htmlContent)).toContain("Reset your password");
  });

  it("falls back to the configured webhook when Brevo delivery fails", async () => {
    const fetchCalls: Array<{
      init?: RequestInit;
      input: Parameters<typeof fetch>[0];
    }> = [];

    Object.assign(env, {
      BREVO_API_KEY: "brevo-key",
      BREVO_SENDER_EMAIL: "no-reply@example.com",
      BREVO_SENDER_NAME: "CP Automation",
      NODE_ENV: "production",
      PASSWORD_RESET_WEBHOOK_URL: "https://hooks.example.com/password-reset",
    });

    globalThis.fetch = (async (input, init) => {
      fetchCalls.push({ init, input });

      if (fetchCalls.length === 1) {
        return new Response("brevo unavailable", {
          status: 500,
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: {
          "Content-Type": "application/json",
        },
        status: 200,
      });
    }) as typeof fetch;

    const result = await deliverPasswordReset({
      email: "admin@example.com",
      expiresAt: new Date("2026-04-08T12:45:00.000Z"),
      token: "fallback-token",
      verificationCode: "123456",
      username: "admin",
    });

    expect(result.delivery).toBe("webhook");
    expect(fetchCalls.map((call) => String(call.input))).toEqual([
      "https://api.brevo.com/v3/smtp/email",
      "https://hooks.example.com/password-reset",
    ]);

    const webhookCall = fetchCalls[1];

    if (!webhookCall) {
      throw new Error("Expected webhook fetch call to be recorded.");
    }

    const webhookBody = JSON.parse(String(webhookCall.init?.body ?? "{}")) as Record<string, unknown>;

    expect(String(webhookBody.email)).toBe("admin@example.com");
    expect(String(webhookBody.username)).toBe("admin");
    expect(String(webhookBody.reset_url)).toContain("/admin/reset-password.html?token=fallback-token");
    expect(String(webhookBody.verification_code)).toBe("123456");
  });
});
