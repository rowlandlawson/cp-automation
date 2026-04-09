import { HttpError } from "./http-error";

export function readRouteParam(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `Invalid ${fieldName}.`);
  }

  return value;
}

export function parseIdParam(value: unknown, fieldName = "id"): number {
  const parsed = Number(readRouteParam(value, fieldName));

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(400, `Invalid ${fieldName}.`);
  }

  return parsed;
}

export function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${fieldName} is required.`);
  }

  return value.trim();
}

export function requireEmail(value: unknown, fieldName: string): string {
  const email = requireString(value, fieldName).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, `${fieldName} must be a valid email address.`);
  }

  return email;
}

export function optionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} must be a string.`);
  }

  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
}

export function nullableString(value: unknown, fieldName: string): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} must be a string.`);
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

export function optionalInteger(value: unknown, fieldName: string): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(parsed)) {
    throw new HttpError(400, `${fieldName} must be an integer.`);
  }

  return parsed;
}

export function optionalId(value: unknown, fieldName: string): number | undefined {
  const parsed = optionalInteger(value, fieldName);

  if (parsed !== undefined && parsed < 1) {
    throw new HttpError(400, `${fieldName} must be a positive integer.`);
  }

  return parsed;
}

export function nullableId(value: unknown, fieldName: string): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();

    if (trimmed === "" || trimmed === "null") {
      return null;
    }
  }

  const parsed = optionalInteger(value, fieldName);

  if (parsed === undefined) {
    return null;
  }

  if (parsed < 1) {
    throw new HttpError(400, `${fieldName} must be a positive integer.`);
  }

  return parsed;
}

export function optionalBoolean(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  throw new HttpError(400, `${fieldName} must be a boolean.`);
}

export function optionalJson<T = unknown>(value: unknown, fieldName: string): T | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed === "") {
      return undefined;
    }

    try {
      return JSON.parse(trimmed) as T;
    } catch {
      throw new HttpError(400, `${fieldName} must be valid JSON.`);
    }
  }

  if (typeof value === "object" && value !== null) {
    return value as T;
  }

  throw new HttpError(400, `${fieldName} must be a JSON object or array.`);
}
