import { createServer } from "node:http";

import { generateAuthToken } from "../../utils/auth";
import { createApp } from "../../app";
import { env } from "../../config/env";
import { resetPrismaClient, setPrismaClient } from "../../config/prisma";

type ApiBody = ArrayBuffer | Blob | FormData | string | Uint8Array;
type ApiHeaders = Array<[string, string]> | Headers | Record<string, string>;
type JsonRecord = Record<string, unknown>;

export type ApiResponse<T = unknown> = {
  payload: T | string | null;
  status: number;
};

export type TestUser = {
  createdAt: Date;
  email: string;
  id: number;
  isActive: boolean;
  passwordChangedAt: Date | null;
  passwordHash: string;
  role: string;
  updatedAt: Date;
  username: string;
};

export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    email: "admin@example.com",
    id: 1,
    isActive: true,
    passwordChangedAt: null,
    passwordHash: "not-used-in-this-test",
    role: "ADMIN",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    username: "admin",
    ...overrides,
  };
}

export function createAuthToken(user: Pick<TestUser, "id" | "role" | "username">): string {
  env.JWT_SECRET = "phase-4-test-secret";
  return generateAuthToken(user);
}

export function createPrismaKnownRequestError(
  code: string,
  target: string[] | string,
  message = `Prisma error ${code}`,
): Error & {
  code: string;
  meta: {
    target: string[] | string;
  };
} {
  const error = new Error(message) as Error & {
    code: string;
    meta: {
      target: string[] | string;
    };
  };

  error.code = code;
  error.meta = { target };

  return error;
}

export function createPngBlob(variant: "a" | "b" = "a"): Blob {
  const base64 =
    variant === "a"
      ? "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8/5+hHgAHggJ/Pm6q3QAAAABJRU5ErkJggg=="
      : "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mP8z/C/HwAGgwJ/l7sRKQAAAABJRU5ErkJggg==";

  return new Blob([Buffer.from(base64, "base64")], { type: "image/png" });
}

export function getJsonObject(response: ApiResponse, label: string): JsonRecord {
  if (
    !response.payload ||
    typeof response.payload !== "object" ||
    Array.isArray(response.payload)
  ) {
    throw new Error(`${label} did not return a JSON object.`);
  }

  return response.payload as JsonRecord;
}

export function getJsonArray(response: ApiResponse, label: string): JsonRecord[] {
  if (!Array.isArray(response.payload)) {
    throw new Error(`${label} did not return a JSON array.`);
  }

  return response.payload as JsonRecord[];
}

export async function startApiTestServer(prismaClient: unknown): Promise<{
  close: () => Promise<void>;
  request: <T = unknown>(
    path: string,
    options?: {
      body?: ApiBody | JsonRecord;
      headers?: ApiHeaders;
      method?: string;
      token?: string;
    },
  ) => Promise<ApiResponse<T>>;
}> {
  env.JWT_SECRET = "phase-4-test-secret";
  env.NODE_ENV = "test";
  env.CORS_ORIGIN = "http://localhost:3000";
  env.CORS_ORIGINS = ["http://localhost:3000"];

  setPrismaClient(prismaClient as never);

  const app = createApp();
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.listen(0, "127.0.0.1", (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Could not resolve the test server address.");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      resetPrismaClient();
    },
    async request<T = unknown>(
      path: string,
      options: {
        body?: ApiBody | JsonRecord;
        headers?: ApiHeaders;
        method?: string;
        token?: string;
      } = {},
    ): Promise<ApiResponse<T>> {
      const headers = new Headers(options.headers || {});
      const isFormData = options.body instanceof FormData;
      const isBlob = options.body instanceof Blob;
      const isJsonBody =
        options.body !== undefined &&
        !isFormData &&
        !isBlob &&
        typeof options.body === "object" &&
        !(options.body instanceof ArrayBuffer) &&
        !(options.body instanceof Uint8Array);

      if (options.token) {
        headers.set("Authorization", `Bearer ${options.token}`);
      }

      let body: ApiBody | undefined;
      if (isJsonBody) {
        headers.set("Content-Type", "application/json");
        body = JSON.stringify(options.body);
      } else if (options.body !== undefined) {
        body = options.body as ApiBody;
      }

      const response = await fetch(`${baseUrl}${path}`, {
        body,
        headers,
        method: options.method || "GET",
      });

      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? ((await response.json().catch(() => null)) as T | null)
        : await response.text().catch(() => "");

      return {
        payload,
        status: response.status,
      };
    },
  };
}
