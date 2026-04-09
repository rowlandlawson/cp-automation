import { HttpError } from "../utils/http-error";

export type TimestampFields = {
  created_at: string;
  updated_at: string;
};

export type PublishableFields = TimestampFields & {
  id: number;
  is_published: boolean;
  order_index: number;
};

export function buildUpdateStatement(
  tableName: string,
  id: number,
  fields: Record<string, string | number | boolean | null | undefined>,
): { text: string; values: Array<boolean | number | string | null> } {
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    throw new HttpError(400, `No fields provided for ${tableName} update.`);
  }

  const assignments = entries.map(([columnName], index) => `${columnName} = $${index + 1}`);
  const values = entries.map(([, value]) => value ?? null);

  return {
    text: `
      UPDATE ${tableName}
      SET ${assignments.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${entries.length + 1}
      RETURNING *
    `,
    values: [...values, id],
  };
}

export function getFirstRowOrThrow<T>(rows: T[], context: string): T {
  const row = rows[0];

  if (!row) {
    throw new Error(`${context} did not return a row.`);
  }

  return row;
}
