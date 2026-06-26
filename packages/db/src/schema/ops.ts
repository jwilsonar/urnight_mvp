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
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { id, timestamps } from '../helpers';
import { event } from './events';
import { local } from './companies';
import { zone } from './catalog';
import { user } from './identity';

/** Dominio 8 — Super Admin, Ops, Notifications & Analytics (§4.1). */
export const auditLog = pgTable('audit_log', {
  id: id(),
  actorUserId: uuid('actor_user_id').references(() => user.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 40 }).notNull(),
  entityType: varchar('entity_type', { length: 60 }).notNull(),
  entityId: uuid('entity_id'),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  ipAddress: varchar('ip_address', { length: 45 }),
  deviceInfo: varchar('device_info', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const platformSetting = pgTable(
  'platform_setting',
  {
    id: id(),
    key: varchar('key', { length: 80 }).notNull(),
    value: text('value').notNull(),
    valueType: varchar('value_type', { length: 8 }).notNull().default('string'),
    updatedBy: uuid('updated_by').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_platform_setting_key').on(t.key),
    check(
      'platform_setting_value_type_check',
      sql`${t.valueType} in ('string','number','boolean','json')`,
    ),
  ],
);

export const supportTicket = pgTable(
  'support_ticket',
  {
    id: id(),
    ticketCode: varchar('ticket_code', { length: 20 }).notNull(),
    openedBy: uuid('opened_by').references(() => user.id, { onDelete: 'set null' }),
    localId: uuid('local_id').references(() => local.id, { onDelete: 'set null' }),
    subject: varchar('subject', { length: 200 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 10 }).notNull().default('request'),
    status: varchar('status', { length: 12 }).notNull().default('open'),
    priority: varchar('priority', { length: 8 }).notNull().default('low'),
    assignedTo: uuid('assigned_to').references(() => user.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_support_ticket_code').on(t.ticketCode),
    check('support_ticket_category_check', sql`${t.category} in ('incident','request','bug')`),
    check(
      'support_ticket_status_check',
      sql`${t.status} in ('open','in_progress','resolved','closed')`,
    ),
    check('support_ticket_priority_check', sql`${t.priority} in ('low','medium','high')`),
  ],
);

export const notification = pgTable(
  'notification',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    channel: varchar('channel', { length: 8 }).notNull().default('email'),
    type: varchar('type', { length: 40 }).notNull(),
    subject: varchar('subject', { length: 200 }),
    body: text('body'),
    isTransactional: boolean('is_transactional').notNull().default(true),
    status: varchar('status', { length: 8 }).notNull().default('queued'),
    failureReason: varchar('failure_reason', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
  },
  (t) => [
    index('idx_notification_user').on(t.userId),
    check('notification_channel_check', sql`${t.channel} in ('email','push')`),
    check('notification_status_check', sql`${t.status} in ('queued','sent','failed')`),
  ],
);

export const analyticsEvent = pgTable(
  'analytics_event',
  {
    id: id(),
    userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
    sessionId: varchar('session_id', { length: 80 }),
    eventName: varchar('event_name', { length: 60 }).notNull(),
    eventId: uuid('event_id').references(() => event.id, { onDelete: 'set null' }),
    localId: uuid('local_id').references(() => local.id, { onDelete: 'set null' }),
    zoneId: uuid('zone_id').references(() => zone.id, { onDelete: 'set null' }),
    properties: jsonb('properties'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_analytics_event_name').on(t.eventName)],
);

export const pilotFeedback = pgTable(
  'pilot_feedback',
  {
    id: id(),
    userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
    localId: uuid('local_id').references(() => local.id, { onDelete: 'set null' }),
    source: varchar('source', { length: 8 }).notNull().default('user'),
    area: varchar('area', { length: 8 }).notNull().default('other'),
    score: integer('score'),
    comment: text('comment'),
    linkedIssueRef: varchar('linked_issue_ref', { length: 120 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('pilot_feedback_source_check', sql`${t.source} in ('local','user')`),
    check('pilot_feedback_area_check', sql`${t.area} in ('door','payment','ux','other')`),
  ],
);

export type PlatformSetting = typeof platformSetting.$inferSelect;
export type SupportTicket = typeof supportTicket.$inferSelect;
export type Notification = typeof notification.$inferSelect;
