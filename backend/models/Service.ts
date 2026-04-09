import { query, queryOne } from "../config/db";
import { buildUpdateStatement, getFirstRowOrThrow, type PublishableFields } from "./shared";

export type ServiceRecord = PublishableFields & {
  description: string | null;
  icon_name: string | null;
  id: number;
  name: string;
};

export type CreateServiceInput = {
  description?: string | null;
  icon_name?: string | null;
  is_published?: boolean;
  name: string;
  order_index?: number;
};

export type UpdateServiceInput = Partial<CreateServiceInput>;

export class Service {
  static async getAll(options: { includeUnpublished?: boolean } = {}): Promise<ServiceRecord[]> {
    const { includeUnpublished = false } = options;

    const result = includeUnpublished
      ? await query<ServiceRecord>(
          `
            SELECT *
            FROM services
            ORDER BY order_index ASC, created_at DESC
          `,
        )
      : await query<ServiceRecord>(
          `
            SELECT *
            FROM services
            WHERE is_published = true
            ORDER BY order_index ASC, created_at DESC
          `,
        );

    return result.rows;
  }

  static async getById(id: number): Promise<ServiceRecord | null> {
    return queryOne<ServiceRecord>("SELECT * FROM services WHERE id = $1", [id]);
  }

  static async create(data: CreateServiceInput): Promise<ServiceRecord> {
    const result = await query<ServiceRecord>(
      `
        INSERT INTO services (name, description, icon_name, order_index, is_published)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        data.name,
        data.description ?? null,
        data.icon_name ?? null,
        data.order_index ?? 0,
        data.is_published ?? true,
      ],
    );

    return getFirstRowOrThrow(result.rows, "Creating service");
  }

  static async update(id: number, data: UpdateServiceInput): Promise<ServiceRecord | null> {
    const statement = buildUpdateStatement("services", id, {
      name: data.name,
      description: data.description,
      icon_name: data.icon_name,
      order_index: data.order_index,
      is_published: data.is_published,
    });

    const result = await query<ServiceRecord>(statement.text, statement.values);

    return result.rows[0] ?? null;
  }

  static async delete(id: number): Promise<{ id: number } | null> {
    return queryOne<{ id: number }>("DELETE FROM services WHERE id = $1 RETURNING id", [id]);
  }
}
