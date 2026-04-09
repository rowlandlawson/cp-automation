import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { HttpError } from "./http-error";

export type AuthTokenPayload = {
  id: number;
  issuedAt?: number;
  issuedAtMs?: number;
  role: string;
  username: string;
};

export type AuthUserRecord = {
  created_at: Date;
  email: string;
  id: number;
  is_active: boolean;
  role: string;
  updated_at: Date;
  username: string;
};

export type SafeUser = AuthUserRecord;

function getJwtSecret(): string {
  if (!env.JWT_SECRET) {
    throw new HttpError(500, "JWT authentication is not configured.");
  }

  return env.JWT_SECRET;
}

export function generateAuthToken(user: Pick<AuthUserRecord, "id" | "role" | "username">): string {
  return jwt.sign(
    {
      id: user.id,
      issuedAtMs: Date.now(),
      username: user.username,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: "7d",
    },
  );
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (typeof decoded === "string") {
    throw new HttpError(401, "Invalid token.");
  }

  if (
    typeof decoded.id !== "number" ||
    typeof decoded.username !== "string" ||
    typeof decoded.role !== "string"
  ) {
    throw new HttpError(401, "Invalid token payload.");
  }

  return {
    id: decoded.id,
    issuedAt: typeof decoded.iat === "number" ? decoded.iat : undefined,
    issuedAtMs:
      typeof decoded.issuedAtMs === "number"
        ? decoded.issuedAtMs
        : typeof decoded.iat === "number"
          ? decoded.iat * 1000
          : undefined,
    username: decoded.username,
    role: decoded.role,
  };
}

export function sanitizeUser(user: AuthUserRecord): SafeUser {
  return user;
}
