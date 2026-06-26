import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * PK estándar del proyecto (§2.3): `id` uuid, default `gen_random_uuid()`.
 * Función → cada tabla obtiene su propio column builder.
 */
export const id = () => uuid('id').primaryKey().default(sql`gen_random_uuid()`);

/** Columnas de auditoría reutilizables (snake_case, timestamptz). */
export const timestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
