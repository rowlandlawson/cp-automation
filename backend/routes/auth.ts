import { Router } from "express";
import bcryptjs from "bcryptjs";

import { env } from "../config/env";
import type { User } from "../generated/prisma/client";
import { asyncHandler } from "../middleware/async-handler";
import { auth } from "../middleware/auth";
import { generateAuthToken, sanitizeUser } from "../utils/auth";
import { HttpError } from "../utils/http-error";
import {
  assertPasswordPolicy,
  getPasswordPolicyMessage,
  PASSWORD_MIN_LENGTH,
} from "../utils/password-policy";
import {
  createPasswordResetToken,
  deliverPasswordReset,
  hashPasswordResetCode,
  hashPasswordResetToken,
} from "../utils/password-reset";
import { requirePrisma } from "../utils/prisma-request";
import { serializeUser } from "../utils/prisma-serializers";
import { optionalString, requireEmail, requireString } from "../utils/request";

const authRouter = Router();

function createAuthResponse(user: User) {
  return {
    token: generateAuthToken(user),
    user: sanitizeUser(serializeUser(user)),
  };
}

function getResetRequestMeta(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}) {
  const requestedByIp = req.ip?.trim().slice(0, 64) || null;
  const rawUserAgent = req.headers["user-agent"];
  const requestedUserAgent =
    typeof rawUserAgent === "string"
      ? rawUserAgent.trim().slice(0, 255)
      : Array.isArray(rawUserAgent)
        ? String(rawUserAgent[0] ?? "")
            .trim()
            .slice(0, 255)
        : null;

  return {
    requestedByIp,
    requestedUserAgent: requestedUserAgent || null,
  };
}

function getResetIdentifierFilters(identifier: string) {
  return [{ username: identifier }, { email: identifier.toLowerCase() }];
}

function normalizeResetCode(value: unknown): string {
  const code = requireString(value, "code").replace(/\s+/g, "");

  if (!/^\d{6}$/.test(code)) {
    throw new HttpError(400, "Verification code must be 6 digits.");
  }

  return code;
}

function assertPasswordResetTokenUsable(
  resetToken:
    | {
        expiresAt: Date;
        usedAt: Date | null;
        user: {
          isActive: boolean;
          passwordHash: string;
        };
      }
    | null,
): asserts resetToken is {
  expiresAt: Date;
  usedAt: Date | null;
  user: {
    isActive: boolean;
    passwordHash: string;
  };
} {
  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt.getTime() <= Date.now() ||
    !resetToken.user.isActive
  ) {
    throw new HttpError(400, "Password reset link is invalid or has expired.");
  }
}

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();

    const username = requireString(req.body.username, "username");
    const password = requireString(req.body.password, "password");

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!user || !user.isActive) {
      throw new HttpError(401, "Invalid credentials.");
    }

    const passwordMatches = await bcryptjs.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new HttpError(401, "Invalid credentials.");
    }

    res.json(createAuthResponse(user));
  }),
);

authRouter.get(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();

    if (!req.userId) {
      throw new HttpError(401, "Unauthenticated.");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user || !user.isActive) {
      throw new HttpError(404, "User not found.");
    }

    res.json({
      user: sanitizeUser(serializeUser(user)),
    });
  }),
);

authRouter.get("/password-policy", (_req, res) => {
  res.json({
    message: getPasswordPolicyMessage(),
    min_length: PASSWORD_MIN_LENGTH,
    requires: {
      lowercase: true,
      number: true,
      symbol: true,
      uppercase: true,
    },
  });
});

authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const identifier = requireString(req.body.identifier, "identifier");
    const genericMessage =
      "If an active account matches that email or username, a reset link has been prepared.";

    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
        OR: getResetIdentifierFilters(identifier),
      },
    });

    let debugResetUrl: string | undefined;
    let debugVerificationCode: string | undefined;

    if (user) {
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      const { expiresAt, token, tokenHash, verificationCode, verificationCodeHash } =
        createPasswordResetToken();
      await prisma.passwordResetToken.create({
        data: {
          ...getResetRequestMeta(req),
          expiresAt,
          tokenHash,
          userId: user.id,
          verificationCodeHash,
        },
      });

      const delivery = await deliverPasswordReset({
        email: user.email,
        expiresAt,
        requestId: req.requestId,
        token,
        verificationCode,
        username: user.username,
      });

      if (env.NODE_ENV !== "production") {
        debugResetUrl = delivery.resetUrl;
        debugVerificationCode = verificationCode;
      }
    }

    res.json({
      message: genericMessage,
      ...(debugResetUrl ? { debug_reset_url: debugResetUrl } : {}),
      ...(debugVerificationCode ? { debug_verification_code: debugVerificationCode } : {}),
      success: true,
    });
  }),
);

authRouter.post(
  "/verify-reset-code",
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const identifier = requireString(req.body.identifier, "identifier");
    const code = normalizeResetCode(req.body.code);

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        expiresAt: {
          gt: new Date(),
        },
        usedAt: null,
        verificationCodeHash: hashPasswordResetCode(code),
        user: {
          isActive: true,
          OR: getResetIdentifierFilters(identifier),
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!resetToken) {
      throw new HttpError(400, "Verification code is invalid or has expired.");
    }

    res.json({
      message: "Verification code accepted. Continue to set a new password.",
      success: true,
    });
  }),
);

authRouter.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const token = optionalString(req.body.token, "token");
    const identifier = optionalString(req.body.identifier, "identifier");
    const code = req.body.code !== undefined ? normalizeResetCode(req.body.code) : undefined;
    const password = requireString(req.body.password, "password");

    assertPasswordPolicy(password);

    let resetToken;

    if (token) {
      resetToken = await prisma.passwordResetToken.findUnique({
        where: {
          tokenHash: hashPasswordResetToken(token),
        },
        include: {
          user: true,
        },
      });
    } else {
      if (!identifier || !code) {
        throw new HttpError(
          400,
          "Provide either a reset token or the identifier and verification code.",
        );
      }

      resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          expiresAt: {
            gt: new Date(),
          },
          usedAt: null,
          verificationCodeHash: hashPasswordResetCode(code),
          user: {
            isActive: true,
            OR: getResetIdentifierFilters(identifier),
          },
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    assertPasswordResetTokenUsable(resetToken);

    const passwordMatches = await bcryptjs.compare(password, resetToken.user.passwordHash);

    if (passwordMatches) {
      throw new HttpError(
        400,
        "Choose a new password that is different from the current password.",
      );
    }

    const passwordHash = await bcryptjs.hash(password, 12);
    const passwordChangedAt = new Date();

    const updatedUser = await prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          passwordChangedAt,
          passwordHash,
        },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
        },
        data: {
          usedAt: passwordChangedAt,
        },
      });

      return nextUser;
    });

    res.json({
      ...createAuthResponse(updatedUser),
      message: "Password reset successful.",
    });
  }),
);

authRouter.post(
  "/change-email",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();

    if (!req.userId) {
      throw new HttpError(401, "Unauthenticated.");
    }

    const currentPassword = requireString(req.body.current_password, "current_password");
    const nextEmail = requireEmail(req.body.email, "email");

    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!user || !user.isActive) {
      throw new HttpError(404, "User not found.");
    }

    const currentPasswordMatches = await bcryptjs.compare(currentPassword, user.passwordHash);

    if (!currentPasswordMatches) {
      throw new HttpError(400, "Current password is incorrect.");
    }

    if (user.email.toLowerCase() === nextEmail) {
      throw new HttpError(400, "Choose a new email address that is different from the current one.");
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        email: nextEmail,
      },
    });

    res.json({
      ...createAuthResponse(updatedUser),
      message: "Recovery email updated successfully.",
    });
  }),
);

authRouter.post(
  "/change-password",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();

    if (!req.userId) {
      throw new HttpError(401, "Unauthenticated.");
    }

    const currentPassword = requireString(req.body.current_password, "current_password");
    const newPassword = requireString(req.body.new_password, "new_password");

    assertPasswordPolicy(newPassword);

    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!user || !user.isActive) {
      throw new HttpError(404, "User not found.");
    }

    const currentPasswordMatches = await bcryptjs.compare(currentPassword, user.passwordHash);

    if (!currentPasswordMatches) {
      throw new HttpError(400, "Current password is incorrect.");
    }

    const newPasswordMatchesExisting = await bcryptjs.compare(newPassword, user.passwordHash);

    if (newPasswordMatchesExisting) {
      throw new HttpError(
        400,
        "Choose a new password that is different from the current password.",
      );
    }

    const passwordHash = await bcryptjs.hash(newPassword, 12);
    const passwordChangedAt = new Date();

    const updatedUser = await prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordChangedAt,
          passwordHash,
        },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: passwordChangedAt,
        },
      });

      return nextUser;
    });

    res.json({
      ...createAuthResponse(updatedUser),
      message: "Password changed successfully.",
    });
  }),
);

export { authRouter };
