import type { NextFunction, Request, Response } from "express";

import { HttpError } from "../utils/http-error";
import { logError } from "../utils/logger";

type PrismaLikeError = {
  code?: string;
  meta?: {
    target?: string[] | string;
  };
};

function getPrismaErrorResponse(error: unknown): { message: string; statusCode: number } | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const prismaError = error as PrismaLikeError;

  if (prismaError.code === "P2002") {
    const target = Array.isArray(prismaError.meta?.target)
      ? prismaError.meta?.target.join(", ")
      : typeof prismaError.meta?.target === "string"
        ? prismaError.meta.target
        : "the requested field";

    return {
      message: `Duplicate value for ${target}.`,
      statusCode: 409,
    };
  }

  if (prismaError.code === "P2025") {
    return {
      message: "Requested record was not found.",
      statusCode: 404,
    };
  }

  return null;
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const prismaErrorResponse = getPrismaErrorResponse(error);
  const statusCode =
    error instanceof HttpError ? error.statusCode : (prismaErrorResponse?.statusCode ?? 500);
  const message =
    error instanceof HttpError
      ? error.message
      : (prismaErrorResponse?.message ??
        (error instanceof Error ? error.message : "Internal server error."));

  logError("http_request_failed", error, {
    method: req.method,
    path: req.originalUrl,
    request_id: req.requestId ?? null,
    status_code: statusCode,
    user_id: req.userId ?? null,
  });

  res.status(statusCode).json({
    error: message,
    request_id: req.requestId ?? null,
  });
}
