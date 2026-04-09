import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import { Pool } from "pg";

import { env } from "./env";

export const pool = env.DATABASE_URL
  ? new Pool({
      connectionString: env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  : null;

pool?.on("error", (error) => {
  console.error("[db] Unexpected error on idle client", error);
});

function getPool(): Pool {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return pool;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(env.DATABASE_URL);
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const result = await query<T>(text, params);

  return result.rows[0] ?? null;
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function executeSqlFile(filePath: string): Promise<void> {
  const sql = await Bun.file(filePath).text();
  await query(sql);
}
