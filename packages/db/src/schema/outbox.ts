import { sql } from 'drizzle-orm';
import { check, index, integer, jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { id, timestamps } from '../helpers';

/**
 * Outbox transaccional (§3.2). El caso de uso inserta el job en la MISMA Tx que
 * el cambio de negocio → entrega fiable (no se pierde email/PDF/atribución si el
 * proceso cae tras el commit). Un relay (worker) drena 'pending' hacia BullMQ y
 * marca 'done'. No es una entidad de dominio: es infraestructura compartida.
 */
export const outbox = pgTable(
  'outbox',
  {
    id: id(),
    queue: varchar('queue', { length: 40 }).notNull(),
    name: varchar('name', { length: 60 }).notNull(),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    status: varchar('status', { length: 12 }).notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    availableAt: timestamp('available_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    // Drenaje del relay: pendientes ordenados por disponibilidad.
    index('idx_outbox_pending').on(t.status, t.availableAt),
    check('outbox_status_check', sql`${t.status} in ('pending','processing','done','failed')`),
  ],
);

export type OutboxRow = typeof outbox.$inferSelect;
export type NewOutboxRow = typeof outbox.$inferInsert;
