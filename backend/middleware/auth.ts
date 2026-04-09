import type { NextFunction, Request, Response } from "express";

import { verifyAuthToken } from "../utils/auth";
import { HttpError } from "../utils/http-error";
import { requirePrisma } from "../utils/prisma-request";

export async function auth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const prisma = requirePrisma();

    const authorizationHeader = req.headers.authorization;
    const token = authorizationHeader?.startsWith("Bearer ")
      ? authorizationHeader.slice("Bearer ".length)
      : undefined;

    if (!token) {
      throw new HttpError(401, "No token provided.");
    }

    const decoded = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        role: true,
        isActive: true,
        passwordChangedAt: true,
        username: true,
      },
    });

    if (!user || !user.isActive) {
      throw new HttpError(401, "Invalid token.");
    }

    if (
      user.passwordChangedAt &&
      decoded.issuedAtMs &&
      decoded.issuedAtMs < user.passwordChangedAt.getTime()
    ) {
      throw new HttpError(401, "Token is no longer valid.");
    }

    req.userId = decoded.id;
    req.authUser = {
      id: user.id,
      role: user.role,
      username: user.username,
    };
    next();
  } catch (error) {
    next(error);
  }
}
