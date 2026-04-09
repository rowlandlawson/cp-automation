import { Prisma } from "../generated/prisma/client";
import { getPrisma } from "../config/prisma";
import { HttpError } from "./http-error";
import { optionalJson } from "./request";

export function requirePrisma() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new HttpError(500, "Prisma client is not configured.");
  }

  return prisma;
}

export function parseJsonInput(
  value: unknown,
  fieldName: string,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = optionalJson<Prisma.InputJsonValue | null>(value, fieldName);
  return parsed === null ? Prisma.JsonNull : parsed;
}
