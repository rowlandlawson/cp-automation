import { query, queryOne } from "../config/db";
import { buildUpdateStatement, getFirstRowOrThrow, type TimestampFields } from "./shared";

export type UserRecord = TimestampFields & {
  id: number;
  email: string;
  is_active: boolean;
  password_hash: string;
  role: string;
  username: string;
};

export type CreateUserInput = {
  email: string;
  is_active?: boolean;
  password_hash: string;
  role?: string;
  username: string;
};

export type UpdateUserInput = Partial<{
  email: string;
  is_active: boolean;
  password_hash: string;
  role: string;
  username: string;
}>;

export class User {
  static async getAll(options: { activeOnly?: boolean } = {}): Promise<UserRecord[]> {
    const { activeOnly = false } = options;

    if (activeOnly) {
      const result = await query<UserRecord>(
        `
          SELECT *
          FROM users
          WHERE is_active = true
          ORDER BY created_at DESC
        `,
      );

      return result.rows;
    }

    const result = await query<UserRecord>(
      `
        SELECT *
        FROM users
        ORDER BY created_at DESC
      `,
    );

    return result.rows;
  }

  static async getById(id: number): Promise<UserRecord | null> {
    return queryOne<UserRecord>("SELECT * FROM users WHERE id = $1", [id]);
  }

  static async getByUsername(username: string): Promise<UserRecord | null> {
    return queryOne<UserRecord>("SELECT * FROM users WHERE username = $1 LIMIT 1", [username]);
  }

  static async getByEmail(email: string): Promise<UserRecord | null> {
    return queryOne<UserRecord>("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
  }

  static async create(data: CreateUserInput): Promise<UserRecord> {
    const result = await query<UserRecord>(
      `
        INSERT INTO users (username, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [data.username, data.email, data.password_hash, data.role ?? "admin", data.is_active ?? true],
    );

    return getFirstRowOrThrow(result.rows, "Creating user");
  }

  static async update(id: number, data: UpdateUserInput): Promise<UserRecord | null> {
    const statement = buildUpdateStatement("users", id, {
      username: data.username,
      email: data.email,
      password_hash: data.password_hash,
      role: data.role,
      is_active: data.is_active,
    });

    const result = await query<UserRecord>(statement.text, statement.values);

    return result.rows[0] ?? null;
  }

  static async delete(id: number): Promise<{ id: number } | null> {
    return queryOne<{ id: number }>("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
  }
}
