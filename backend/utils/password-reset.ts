import { createHash, randomBytes, randomInt } from "node:crypto";

import { env } from "../config/env";
import { logError, logInfo, logWarn } from "./logger";

const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_CODE_DIGITS = 6;
const PASSWORD_RESET_CODE_MAX = 10 ** PASSWORD_RESET_CODE_DIGITS;

type PasswordResetDeliveryInput = {
  email: string;
  expiresAt: Date;
  requestId?: string | null;
  token: string;
  verificationCode: string;
  username: string;
};

type PasswordResetDeliveryPayload = {
  email: string;
  expires_at: string;
  request_id: string | null;
  reset_url: string;
  verification_code: string;
  username: string;
};

type PasswordResetDeliveryResult = {
  delivery: "brevo" | "log_only" | "webhook";
  resetUrl: string;
};

function getAdminAppUrl(): string {
  const normalized = env.ADMIN_APP_URL.trim().replace(/\/+$/, "");
  return /\/admin$/i.test(normalized) ? normalized : `${normalized}/admin`;
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPasswordResetCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function createPasswordResetToken(): {
  expiresAt: Date;
  token: string;
  tokenHash: string;
  verificationCode: string;
  verificationCodeHash: string;
} {
  const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("hex");
  const verificationCode = randomInt(0, PASSWORD_RESET_CODE_MAX)
    .toString()
    .padStart(PASSWORD_RESET_CODE_DIGITS, "0");
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  return {
    expiresAt,
    token,
    tokenHash: hashPasswordResetToken(token),
    verificationCode,
    verificationCodeHash: hashPasswordResetCode(verificationCode),
  };
}

export function buildPasswordResetUrl(token: string): string {
  return `${getAdminAppUrl()}/reset-password.html?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function buildPasswordResetPayload(input: PasswordResetDeliveryInput, resetUrl: string): PasswordResetDeliveryPayload {
  return {
    email: input.email,
    expires_at: input.expiresAt.toISOString(),
    request_id: input.requestId ?? null,
    reset_url: resetUrl,
    verification_code: input.verificationCode,
    username: input.username,
  };
}

function getBrevoConfiguration(): {
  missing: string[];
  partial: boolean;
  ready: boolean;
} {
  const missing: string[] = [];

  if (!env.BREVO_API_KEY) {
    missing.push("BREVO_API_KEY");
  }

  if (!env.BREVO_SENDER_EMAIL) {
    missing.push("BREVO_SENDER_EMAIL");
  }

  const partial = Boolean(
    env.BREVO_API_KEY || env.BREVO_SENDER_EMAIL || env.BREVO_REPLY_TO_EMAIL || env.BREVO_REPLY_TO_NAME,
  );

  return {
    missing,
    partial: partial && missing.length > 0,
    ready: missing.length === 0,
  };
}

function buildPasswordResetEmail(
  input: PasswordResetDeliveryInput,
  resetUrl: string,
): {
  htmlContent: string;
  subject: string;
  textContent: string;
} {
  const brandName = env.BREVO_SENDER_NAME || "CP Automation";
  const safeBrandName = escapeHtml(brandName);
  const safeUsername = escapeHtml(input.username || input.email);
  const safeResetUrl = escapeHtml(resetUrl);
  const safeVerificationCode = escapeHtml(input.verificationCode);
  const ttlMinutes = String(env.PASSWORD_RESET_TOKEN_TTL_MINUTES);

  return {
    htmlContent:
      `<p>Hello ${safeUsername},</p>` +
      `<p>We received a request to reset your ${safeBrandName} password.</p>` +
      `<p><a href="${safeResetUrl}">Reset your password</a></p>` +
      `<p>Verification code: <strong>${safeVerificationCode}</strong></p>` +
      `<p>This link expires in ${ttlMinutes} minutes.</p>` +
      "<p>If you did not request this, you can safely ignore this email.</p>",
    subject: `Reset your ${brandName} password`,
    textContent: [
      `Hello ${input.username || input.email},`,
      "",
      `We received a request to reset your ${brandName} password.`,
      "",
      `Reset your password: ${resetUrl}`,
      `Verification code: ${input.verificationCode}`,
      "",
      `This link expires in ${ttlMinutes} minutes.`,
      "",
      "If you did not request this, you can safely ignore this email.",
    ].join("\n"),
  };
}

async function deliverPasswordResetByBrevo(
  input: PasswordResetDeliveryInput,
  resetUrl: string,
): Promise<PasswordResetDeliveryResult> {
  const emailContent = buildPasswordResetEmail(input, resetUrl);
  const sender = {
    email: env.BREVO_SENDER_EMAIL,
    ...(env.BREVO_SENDER_NAME ? { name: env.BREVO_SENDER_NAME } : {}),
  };
  const replyTo = env.BREVO_REPLY_TO_EMAIL
    ? {
        email: env.BREVO_REPLY_TO_EMAIL,
        ...(env.BREVO_REPLY_TO_NAME ? { name: env.BREVO_REPLY_TO_NAME } : {}),
      }
    : undefined;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    body: JSON.stringify({
      htmlContent: emailContent.htmlContent,
      ...(replyTo ? { replyTo } : {}),
      sender,
      subject: emailContent.subject,
      textContent: emailContent.textContent,
      to: [
        {
          email: input.email,
          ...(input.username ? { name: input.username } : {}),
        },
      ],
    }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": env.BREVO_API_KEY,
    },
    method: "POST",
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(
      `Brevo password reset email failed with HTTP ${response.status}${responseText ? `: ${responseText}` : "."}`,
    );
  }

  logInfo("password_reset_requested", {
    delivery: "brevo",
    email: input.email,
    expires_at: input.expiresAt.toISOString(),
    request_id: input.requestId ?? null,
    username: input.username,
  });

  return {
    delivery: "brevo",
    resetUrl,
  };
}

async function deliverPasswordResetByWebhook(
  input: PasswordResetDeliveryInput,
  payload: PasswordResetDeliveryPayload,
  resetUrl: string,
): Promise<PasswordResetDeliveryResult> {
  const response = await fetch(env.PASSWORD_RESET_WEBHOOK_URL, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(
      `Password reset webhook failed with HTTP ${response.status}${responseText ? `: ${responseText}` : "."}`,
    );
  }

  logInfo("password_reset_requested", {
    delivery: "webhook",
    email: input.email,
    expires_at: input.expiresAt.toISOString(),
    request_id: input.requestId ?? null,
    username: input.username,
  });

  return {
    delivery: "webhook",
    resetUrl,
  };
}

export async function deliverPasswordReset(
  input: PasswordResetDeliveryInput,
): Promise<PasswordResetDeliveryResult> {
  const resetUrl = buildPasswordResetUrl(input.token);
  const payload = buildPasswordResetPayload(input, resetUrl);
  const brevoConfiguration = getBrevoConfiguration();
  const fallbackReasons: string[] = [];

  if (brevoConfiguration.partial) {
    const reason = `Brevo is partially configured. Missing: ${brevoConfiguration.missing.join(", ")}.`;
    fallbackReasons.push(reason);
    logWarn("password_reset_delivery_misconfigured", {
      delivery: "brevo",
      email: input.email,
      missing: brevoConfiguration.missing,
      request_id: input.requestId ?? null,
      username: input.username,
    });
  }

  if (brevoConfiguration.ready) {
    try {
      return await deliverPasswordResetByBrevo(input, resetUrl);
    } catch (error) {
      fallbackReasons.push("Brevo delivery failed.");
      logError("password_reset_delivery_failed", error, {
        delivery: "brevo",
        email: input.email,
        request_id: input.requestId ?? null,
        username: input.username,
      });
    }
  }

  if (env.PASSWORD_RESET_WEBHOOK_URL) {
    try {
      return await deliverPasswordResetByWebhook(input, payload, resetUrl);
    } catch (error) {
      fallbackReasons.push("Webhook delivery failed.");
      logError("password_reset_delivery_failed", error, {
        delivery: "webhook",
        email: input.email,
        request_id: input.requestId ?? null,
        username: input.username,
      });
    }
  }

  if (fallbackReasons.length === 0) {
    fallbackReasons.push("No password reset delivery provider is configured.");
  }

  if (env.NODE_ENV === "production") {
    logWarn("password_reset_delivery_skipped", {
      delivery: "log_only",
      email: input.email,
      expires_at: input.expiresAt.toISOString(),
      reason: fallbackReasons.join(" "),
      request_id: input.requestId ?? null,
      username: input.username,
    });
  } else {
    logInfo("password_reset_requested", {
      delivery: "log_only",
      fallback_reason: fallbackReasons.join(" "),
      ...payload,
    });
  }

  return {
    delivery: "log_only",
    resetUrl,
  };
}
