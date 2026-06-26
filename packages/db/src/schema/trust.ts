import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { id } from '../helpers';
import { ticket } from './checkout';
import { event } from './events';
import { local } from './companies';
import { user } from './identity';

/** Dominio 7 — Trust: Reviews & Reports (§4.1). Target polimórfico local|event. */
const polymorphicTarget = (t: { localId: unknown; eventId: unknown }) =>
  check(
    'target_one_of_check',
    sql`(${t.localId} is not null and ${t.eventId} is null) or (${t.localId} is null and ${t.eventId} is not null)`,
  );

export const review = pgTable(
  'review',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    targetType: varchar('target_type', { length: 8 }).notNull(),
    localId: uuid('local_id').references(() => local.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').references(() => event.id, { onDelete: 'cascade' }),
    ticketId: uuid('ticket_id').references(() => ticket.id, { onDelete: 'set null' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    quickTags: jsonb('quick_tags'),
    isVerified: boolean('is_verified').notNull().default(false),
    isReported: boolean('is_reported').notNull().default(false),
    status: varchar('status', { length: 12 }).notNull().default('published'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_review_local').on(t.localId),
    index('idx_review_event').on(t.eventId),
    check('review_target_type_check', sql`${t.targetType} in ('local','event')`),
    check('review_rating_check', sql`${t.rating} between 1 and 5`),
    check('review_status_check', sql`${t.status} in ('published','hidden')`),
    polymorphicTarget(t),
  ],
);

export const report = pgTable(
  'report',
  {
    id: id(),
    reporterUserId: uuid('reporter_user_id').references(() => user.id, { onDelete: 'set null' }),
    targetType: varchar('target_type', { length: 8 }).notNull(),
    localId: uuid('local_id').references(() => local.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').references(() => event.id, { onDelete: 'cascade' }),
    reason: varchar('reason', { length: 16 }).notNull(),
    comment: text('comment'),
    severity: varchar('severity', { length: 8 }).notNull().default('low'),
    status: varchar('status', { length: 10 }).notNull().default('open'),
    resolutionNote: text('resolution_note'),
    resolvedBy: uuid('resolved_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [
    index('idx_report_local').on(t.localId),
    index('idx_report_event').on(t.eventId),
    check('report_target_type_check', sql`${t.targetType} in ('local','event')`),
    check(
      'report_reason_check',
      sql`${t.reason} in ('cancelled','wrong_price','wrong_location','unsafe','other')`,
    ),
    check('report_severity_check', sql`${t.severity} in ('low','medium','high')`),
    check('report_status_check', sql`${t.status} in ('open','reviewed','resolved')`),
    polymorphicTarget(t),
  ],
);

export type Review = typeof review.$inferSelect;
export type Report = typeof report.$inferSelect;
