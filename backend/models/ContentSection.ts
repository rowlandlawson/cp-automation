import { query, queryOne } from "../config/db";
import { buildUpdateStatement, getFirstRowOrThrow, type TimestampFields } from "./shared";

export type ContentSectionRecord = TimestampFields & {
  content: string | null;
  id: number;
  section_name: string;
  updated_by: number | null;
};

export type CreateContentSectionInput = {
  content?: string | null;
  section_name: string;
  updated_by?: number | null;
};

export type UpdateContentSectionInput = Partial<CreateContentSectionInput>;

export class ContentSection {
  static async getAll(): Promise<ContentSectionRecord[]> {
    const result = await query<ContentSectionRecord>(
      `
        SELECT *
        FROM content_sections
        ORDER BY section_name ASC
      `,
    );

    return result.rows;
  }

  static async getById(id: number): Promise<ContentSectionRecord | null> {
    return queryOne<ContentSectionRecord>("SELECT * FROM content_sections WHERE id = $1", [id]);
  }

  static async getBySectionName(sectionName: string): Promise<ContentSectionRecord | null> {
    return queryOne<ContentSectionRecord>(
      `
        SELECT *
        FROM content_sections
        WHERE section_name = $1
        LIMIT 1
      `,
      [sectionName],
    );
  }

  static async create(data: CreateContentSectionInput): Promise<ContentSectionRecord> {
    const result = await query<ContentSectionRecord>(
      `
        INSERT INTO content_sections (section_name, content, updated_by)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [data.section_name, data.content ?? null, data.updated_by ?? null],
    );

    return getFirstRowOrThrow(result.rows, "Creating content section");
  }

  static async update(
    id: number,
    data: UpdateContentSectionInput,
  ): Promise<ContentSectionRecord | null> {
    const statement = buildUpdateStatement("content_sections", id, {
      section_name: data.section_name,
      content: data.content,
      updated_by: data.updated_by,
    });

    const result = await query<ContentSectionRecord>(statement.text, statement.values);

    return result.rows[0] ?? null;
  }

  static async delete(id: number): Promise<{ id: number } | null> {
    return queryOne<{ id: number }>("DELETE FROM content_sections WHERE id = $1 RETURNING id", [
      id,
    ]);
  }
}
