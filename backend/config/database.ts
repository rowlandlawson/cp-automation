import path from "node:path";

import { executeSqlFile, isDatabaseConfigured, pool, query } from "./db";
import { env } from "./env";
import { isPrismaConfigured, prisma } from "./prisma";

type DatabaseConnectionState = "connected" | "not_configured" | "unavailable";

type DatabaseConnectionResult = {
  message: string;
  state: DatabaseConnectionState;
};

type DatabaseSchemaResult = {
  filePath: string;
  message: string;
  state: "applied" | "not_configured" | "failed";
};

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const errorWithCode = error as {
      address?: string;
      code?: string;
      errors?: Array<{ code?: string }>;
      port?: number;
    };

    const nestedCode = errorWithCode.errors?.find((entry) => entry.code)?.code;
    const code = errorWithCode.code ?? nestedCode;
    const errorMessage = error instanceof Error ? error.message.trim() : "";

    if (code && errorMessage.includes("Invalid `prisma.$queryRaw") && !errorWithCode.address) {
      return code;
    }

    if (errorMessage) {
      return errorMessage;
    }

    if (code && errorWithCode.address && errorWithCode.port) {
      return `${code} (${errorWithCode.address}:${errorWithCode.port})`;
    }

    if (code) {
      return code;
    }
  }

  return String(error);
}

export async function testDatabaseConnection(): Promise<DatabaseConnectionResult> {
  if (!isDatabaseConfigured()) {
    return {
      state: "not_configured",
      message: "DATABASE_URL is not configured yet.",
    };
  }

  try {
    await query("SELECT NOW()");

    return {
      state: "connected",
      message: "Database connection successful.",
    };
  } catch (error) {
    return {
      state: "unavailable",
      message: getErrorMessage(error),
    };
  }
}

export async function testPrismaConnection(): Promise<DatabaseConnectionResult> {
  if (!isPrismaConfigured()) {
    return {
      state: "not_configured",
      message: "DATABASE_URL is not configured yet.",
    };
  }

  if (!prisma) {
    return {
      state: "unavailable",
      message: "Prisma client is not initialized.",
    };
  }

  try {
    await prisma.$queryRawUnsafe("SELECT NOW()");

    return {
      state: "connected",
      message: "Prisma connection successful.",
    };
  } catch (error) {
    return {
      state: "unavailable",
      message: getErrorMessage(error),
    };
  }
}

export async function testDatabaseConnections(): Promise<{
  pg: DatabaseConnectionResult;
  prisma: DatabaseConnectionResult;
}> {
  const [pg, prismaClient] = await Promise.all([testDatabaseConnection(), testPrismaConnection()]);

  return {
    pg,
    prisma: prismaClient,
  };
}

export async function applyDatabaseSchema(
  filePath = path.join(import.meta.dir, "database.sql"),
): Promise<DatabaseSchemaResult> {
  if (!isDatabaseConfigured()) {
    return {
      filePath,
      state: "not_configured",
      message: "DATABASE_URL is not configured yet.",
    };
  }

  try {
    await executeSqlFile(filePath);

    return {
      filePath,
      state: "applied",
      message: "Database schema applied successfully.",
    };
  } catch (error) {
    return {
      filePath,
      state: "failed",
      message: getErrorMessage(error),
    };
  }
}

export { pool };
