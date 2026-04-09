import { query, queryOne } from "../config/db";
import { buildUpdateStatement, getFirstRowOrThrow, type PublishableFields } from "./shared";

export type TestimonialRecord = PublishableFields & {
  author: string | null;
  id: number;
  location: string | null;
  quote: string;
  rating: number;
};

export type CreateTestimonialInput = {
  author?: string | null;
  is_published?: boolean;
  location?: string | null;
  order_index?: number;
  quote: string;
  rating?: number;
};

export type UpdateTestimonialInput = Partial<CreateTestimonialInput>;

export class Testimonial {
  static async getAll(
    options: { includeUnpublished?: boolean } = {},
  ): Promise<TestimonialRecord[]> {
    const { includeUnpublished = false } = options;

    const result = includeUnpublished
      ? await query<TestimonialRecord>(
          `
            SELECT *
            FROM testimonials
            ORDER BY order_index ASC, created_at DESC
          `,
        )
      : await query<TestimonialRecord>(
          `
            SELECT *
            FROM testimonials
            WHERE is_published = true
            ORDER BY order_index ASC, created_at DESC
          `,
        );

    return result.rows;
  }

  static async getById(id: number): Promise<TestimonialRecord | null> {
    return queryOne<TestimonialRecord>("SELECT * FROM testimonials WHERE id = $1", [id]);
  }

  static async create(data: CreateTestimonialInput): Promise<TestimonialRecord> {
    const result = await query<TestimonialRecord>(
      `
        INSERT INTO testimonials (
          quote,
          author,
          location,
          rating,
          order_index,
          is_published
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        data.quote,
        data.author ?? null,
        data.location ?? null,
        data.rating ?? 5,
        data.order_index ?? 0,
        data.is_published ?? true,
      ],
    );

    return getFirstRowOrThrow(result.rows, "Creating testimonial");
  }

  static async update(id: number, data: UpdateTestimonialInput): Promise<TestimonialRecord | null> {
    const statement = buildUpdateStatement("testimonials", id, {
      quote: data.quote,
      author: data.author,
      location: data.location,
      rating: data.rating,
      order_index: data.order_index,
      is_published: data.is_published,
    });

    const result = await query<TestimonialRecord>(statement.text, statement.values);

    return result.rows[0] ?? null;
  }

  static async delete(id: number): Promise<{ id: number } | null> {
    return queryOne<{ id: number }>("DELETE FROM testimonials WHERE id = $1 RETURNING id", [id]);
  }
}
