import { boolean, integer, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { id, timestamps } from '../helpers';

/**
 * Dominio 2 — Taxonomy & Catalogs (§4.1).
 * Cuatro taxonomías de forma idéntica: zone, local_type, music_genre, tag.
 * Convenciones §2.3: tabla snake_case singular, slug UNIQUE, índice `idx_<tabla>_<col>`.
 */
const taxonomyColumns = () => ({
  id: id(),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 140 }).notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps(),
});

export const zone = pgTable('zone', taxonomyColumns(), (t) => [
  uniqueIndex('idx_zone_slug').on(t.slug),
]);

export const localType = pgTable('local_type', taxonomyColumns(), (t) => [
  uniqueIndex('idx_local_type_slug').on(t.slug),
]);

export const musicGenre = pgTable('music_genre', taxonomyColumns(), (t) => [
  uniqueIndex('idx_music_genre_slug').on(t.slug),
]);

export const tag = pgTable('tag', taxonomyColumns(), (t) => [
  uniqueIndex('idx_tag_slug').on(t.slug),
]);

export type Zone = typeof zone.$inferSelect;
export type NewZone = typeof zone.$inferInsert;
