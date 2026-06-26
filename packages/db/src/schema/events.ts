import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { id, timestamps } from '../helpers';
import { tag, musicGenre } from './catalog';
import { local } from './companies';
import { user } from './identity';

/** Dominio 4 — Events & Ticket Types (§4.1). */
export const event = pgTable(
  'event',
  {
    id: id(),
    localId: uuid('local_id')
      .notNull()
      .references(() => local.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 180 }).notNull(),
    slug: varchar('slug', { length: 200 }).notNull(),
    description: text('description'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    flyerUrl: varchar('flyer_url', { length: 512 }),
    totalCapacity: integer('total_capacity').notNull().default(0),
    ticketsSold: integer('tickets_sold').notNull().default(0),
    checkinsCount: integer('checkins_count').notNull().default(0),
    status: varchar('status', { length: 12 }).notNull().default('draft'),
    minAgeNote: varchar('min_age_note', { length: 40 }).notNull().default('+18'),
    dressCode: varchar('dress_code', { length: 120 }),
    // Etiquetas libres por evento (§4.3): strings únicas adicionales a las del
    // catálogo (tag/event_tag). Permiten muchas etiquetas ad-hoc sin poblar el
    // catálogo global. Se persisten como JSON (array de strings).
    customTags: jsonb('custom_tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    createdBy: uuid('created_by').references(() => user.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_event_slug').on(t.slug),
    index('idx_event_local').on(t.localId),
    check(
      'event_status_check',
      sql`${t.status} in ('draft','scheduled','published','cancelled','finished')`,
    ),
  ],
);

export const ticketType = pgTable(
  'ticket_type',
  {
    id: id(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 80 }).notNull(),
    tierCode: varchar('tier_code', { length: 12 }).notNull().default('general'),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('PEN'),
    stock: integer('stock').notNull(),
    sold: integer('sold').notNull().default(0),
    maxPerUser: integer('max_per_user'),
    saleStartsAt: timestamp('sale_starts_at', { withTimezone: true }),
    saleEndsAt: timestamp('sale_ends_at', { withTimezone: true }),
    status: varchar('status', { length: 12 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_ticket_type_event').on(t.eventId),
    check('ticket_type_tier_check', sql`${t.tierCode} in ('general','vip','premium')`),
    check('ticket_type_status_check', sql`${t.status} in ('active','paused','sold_out')`),
    // No sobreventa (barrera DB §invariantes): sold <= stock.
    check('ticket_type_sold_check', sql`${t.sold} <= ${t.stock}`),
  ],
);

export const eventImage = pgTable(
  'event_image',
  {
    id: id(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    url: varchar('url', { length: 512 }).notNull(),
    isFlyer: boolean('is_flyer').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('idx_event_image_event').on(t.eventId)],
);

export const eventGenre = pgTable(
  'event_genre',
  {
    id: id(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    genreId: uuid('genre_id')
      .notNull()
      .references(() => musicGenre.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('idx_event_genre').on(t.eventId, t.genreId)],
);

export const eventTag = pgTable(
  'event_tag',
  {
    id: id(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tag.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('idx_event_tag').on(t.eventId, t.tagId)],
);

export type Event = typeof event.$inferSelect;
export type TicketType = typeof ticketType.$inferSelect;
