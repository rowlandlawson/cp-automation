import { query, queryOne } from "../config/db";
import { buildUpdateStatement, getFirstRowOrThrow, type PublishableFields } from "./shared";

export type ProjectRecord = PublishableFields & {
  description: string | null;
  id: number;
  image_public_id: string | null;
  image_url: string | null;
  location: string | null;
  title: string;
};

export type CreateProjectInput = {
  description?: string | null;
  image_public_id?: string | null;
  image_url?: string | null;
  is_published?: boolean;
  location?: string | null;
  order_index?: number;
  title: string;
};

export type UpdateProjectInput = Partial<CreateProjectInput>;

export class Project {
  static async getAll(options: { includeUnpublished?: boolean } = {}): Promise<ProjectRecord[]> {
    const { includeUnpublished = false } = options;

    const result = includeUnpublished
      ? await query<ProjectRecord>(
          `
            SELECT *
            FROM projects
            ORDER BY order_index ASC, created_at DESC
          `,
        )
      : await query<ProjectRecord>(
          `
            SELECT *
            FROM projects
            WHERE is_published = true
            ORDER BY order_index ASC, created_at DESC
          `,
        );

    return result.rows;
  }

  static async getById(id: number): Promise<ProjectRecord | null> {
    return queryOne<ProjectRecord>("SELECT * FROM projects WHERE id = $1", [id]);
  }

  static async create(data: CreateProjectInput): Promise<ProjectRecord> {
    const result = await query<ProjectRecord>(
      `
        INSERT INTO projects (
          title,
          description,
          location,
          image_url,
          image_public_id,
          order_index,
          is_published
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        data.title,
        data.description ?? null,
        data.location ?? null,
        data.image_url ?? null,
        data.image_public_id ?? null,
        data.order_index ?? 0,
        data.is_published ?? true,
      ],
    );

    return getFirstRowOrThrow(result.rows, "Creating project");
  }

  static async update(id: number, data: UpdateProjectInput): Promise<ProjectRecord | null> {
    const statement = buildUpdateStatement("projects", id, {
      title: data.title,
      description: data.description,
      location: data.location,
      image_url: data.image_url,
      image_public_id: data.image_public_id,
      order_index: data.order_index,
      is_published: data.is_published,
    });

    const result = await query<ProjectRecord>(statement.text, statement.values);

    return result.rows[0] ?? null;
  }

  static async delete(id: number): Promise<{ id: number } | null> {
    return queryOne<{ id: number }>("DELETE FROM projects WHERE id = $1 RETURNING id", [id]);
  }
}
