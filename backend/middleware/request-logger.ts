import type { NextFunction, Request, Response } from "express";

import { logInfo } from "../utils/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();

  res.on("finish", () => {
    logInfo("http_request", {
      duration_ms: Date.now() - startedAt,
      method: req.method,
      path: req.originalUrl,
      request_id: req.requestId ?? null,
      status_code: res.statusCode,
      user_agent: req.get("user-agent") ?? null,
      user_id: req.userId ?? null,
    });
  });

  next();
}
