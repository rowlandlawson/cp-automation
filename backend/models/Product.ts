import { query, queryOne } from "../config/db";
import { buildUpdateStatement, getFirstRowOrThrow, type PublishableFields } from "./shared";

export type ProductRecord = PublishableFields & {
  description: string | null;
  features: string | null;
  id: number;
  name: string;
};

export type CreateProductInput = {
  description?: string | null;
  features?: string | null;
  is_published?: boolean;
  name: string;
  order_index?: number;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export class Product {
  static async getAll(options: { includeUnpublished?: boolean } = {}): Promise<ProductRecord[]> {
    const { includeUnpublished = false } = options;

    const result = includeUnpublished
      ? await query<ProductRecord>(
          `
            SELECT *
            FROM products
            ORDER BY order_index ASC, created_at DESC
          `,
        )
      : await query<ProductRecord>(
          `
            SELECT *
            FROM products
            WHERE is_published = true
            ORDER BY order_index ASC, created_at DESC
          `,
        );

    return result.rows;
  }

  static async getById(id: number): Promise<ProductRecord | null> {
    return queryOne<ProductRecord>("SELECT * FROM products WHERE id = $1", [id]);
  }

  static async create(data: CreateProductInput): Promise<ProductRecord> {
    const result = await query<ProductRecord>(
      `
        INSERT INTO products (name, description, features, order_index, is_published)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        data.name,
        data.description ?? null,
        data.features ?? null,
        data.order_index ?? 0,
        data.is_published ?? true,
      ],
    );

    return getFirstRowOrThrow(result.rows, "Creating product");
  }

  static async update(id: number, data: UpdateProductInput): Promise<ProductRecord | null> {
    const statement = buildUpdateStatement("products", id, {
      name: data.name,
      description: data.description,
      features: data.features,
      order_index: data.order_index,
      is_published: data.is_published,
    });

    const result = await query<ProductRecord>(statement.text, statement.values);

    return result.rows[0] ?? null;
  }

  static async delete(id: number): Promise<{ id: number } | null> {
    return queryOne<{ id: number }>("DELETE FROM products WHERE id = $1 RETURNING id", [id]);
  }
}
