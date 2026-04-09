import type { Request, Response } from "express";

import { testDatabaseConnections } from "../config/database";
import { env } from "../config/env";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const database = await testDatabaseConnections();

  res.status(200).json({
    status: "ok",
    service: "cp-automation-backend",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database,
  });
}
