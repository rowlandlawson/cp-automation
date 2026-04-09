import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";
import { pool } from "./db";
import { env } from "./env";

type PrismaGlobal = typeof globalThis & {
  __cpAutomationPrisma?: PrismaClient | null;
};

const globalForPrisma = globalThis as PrismaGlobal;

function createPrismaClient(): PrismaClient | null {
  if (!pool) {
    return null;
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

function syncGlobalPrisma(nextPrisma: PrismaClient | null): void {
  if (env.NODE_ENV !== "production") {
    globalForPrisma.__cpAutomationPrisma = nextPrisma;
  }
}

export let prisma = globalForPrisma.__cpAutomationPrisma ?? createPrismaClient();

syncGlobalPrisma(prisma);

export function getPrisma(): PrismaClient | null {
  return prisma;
}

export function setPrismaClient(nextPrisma: PrismaClient | null): void {
  prisma = nextPrisma;
  syncGlobalPrisma(nextPrisma);
}

export function resetPrismaClient(): void {
  setPrismaClient(createPrismaClient());
}

export function isPrismaConfigured(): boolean {
  return Boolean(env.DATABASE_URL);
}
