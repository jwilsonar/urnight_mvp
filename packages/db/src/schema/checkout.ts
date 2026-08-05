import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { id, timestamps } from '../helpers';
import { local } from './companies';
import { event, ticketType } from './events';
import { user } from './identity';

/** Dominio 5 — Checkout, Payments & Tickets (§4.1). Dinero: numeric(10,2). */
export const order = pgTable(
  'order',
  {
    id: id(),
    orderCode: varchar('order_code', { length: 20 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'restrict' }),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    discountTotal: numeric('discount_total', { precision: 10, scale: 2 }).notNull().default('0'),
    commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('PEN'),
    status: varchar('status', { length: 12 }).notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('idx_order_code').on(t.orderCode),
    index('idx_order_user').on(t.userId),
    index('idx_order_event').on(t.eventId),
    check(
      'order_status_check',
      sql`${t.status} in ('pending','paid','failed','cancelled','refunded')`,
    ),
  ],
);

export const ticketHold = pgTable(
  'ticket_hold',
  {
    id: id(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    ticketTypeId: uuid('ticket_type_id')
      .notNull()
      .references(() => ticketType.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').references(() => order.id, { onDelete: 'set null' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    status: varchar('status', { length: 12 }).notNull().default('active'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ...timestamps(),
  },
  (t) => [
    index('idx_ticket_hold_event').on(t.eventId),
    index('idx_ticket_hold_ticket_type').on(t.ticketTypeId),
    index('idx_ticket_hold_expires_at').on(t.expiresAt),
    index('idx_ticket_hold_status').on(t.status),
    check('ticket_hold_quantity_check', sql`${t.quantity} > 0`),
    check(
      'ticket_hold_status_check',
      sql`${t.status} in ('active','converted','expired','released')`,
    ),
  ],
);

export const orderItem = pgTable(
  'order_item',
  {
    id: id(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => order.id, { onDelete: 'cascade' }),
    ticketTypeId: uuid('ticket_type_id')
      .notNull()
      .references(() => ticketType.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    lineTotal: numeric('line_total', { precision: 10, scale: 2 }).notNull(),
  },
  (t) => [index('idx_order_item_order').on(t.orderId)],
);

export const payment = pgTable(
  'payment',
  {
    id: id(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => order.id, { onDelete: 'cascade' }),
    gateway: varchar('gateway', { length: 12 }).notNull().default('mock'),
    method: varchar('method', { length: 8 }).notNull(),
    gatewayReference: varchar('gateway_reference', { length: 120 }),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 12 }).notNull().default('pending'),
    failureReason: varchar('failure_reason', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  },
  (t) => [
    index('idx_payment_order').on(t.orderId),
    check('payment_gateway_check', sql`${t.gateway} in ('culqi','izipay','mock')`),
    check('payment_method_check', sql`${t.method} in ('card','yape','plin')`),
    check('payment_status_check', sql`${t.status} in ('pending','approved','rejected')`),
  ],
);

export const ticket = pgTable(
  'ticket',
  {
    id: id(),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItem.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'restrict' }),
    ticketTypeId: uuid('ticket_type_id')
      .notNull()
      .references(() => ticketType.id, { onDelete: 'restrict' }),
    qrCode: varchar('qr_code', { length: 64 }).notNull(),
    status: varchar('status', { length: 12 }).notNull().default('valid'),
    pdfUrl: varchar('pdf_url', { length: 512 }),
    /** Key S3 del PNG del QR (resuelto a URL en presentación). Null hasta generarse. */
    qrImageKey: varchar('qr_image_key', { length: 512 }),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    usedAt: timestamp('used_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('idx_ticket_qr').on(t.qrCode),
    index('idx_ticket_event').on(t.eventId),
    index('idx_ticket_order_item').on(t.orderItemId),
    index('idx_ticket_event_status_used_at').on(t.eventId, t.status, t.usedAt),
    check('ticket_status_check', sql`${t.status} in ('valid','used','cancelled','expired')`),
  ],
);

export const attendee = pgTable(
  'attendee',
  {
    id: id(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => ticket.id, { onDelete: 'cascade' }),
    fullName: varchar('full_name', { length: 120 }).notNull(),
    documentType: varchar('document_type', { length: 10 }).notNull(),
    documentNumber: varchar('document_number', { length: 20 }).notNull(),
    birthDate: date('birth_date').notNull(),
    isBuyer: boolean('is_buyer').notNull().default(false),
  },
  (t) => [
    uniqueIndex('idx_attendee_ticket').on(t.ticketId),
    check('attendee_document_type_check', sql`${t.documentType} in ('dni','ce','passport')`),
  ],
);

export const qrValidation = pgTable(
  'qr_validation',
  {
    id: id(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => ticket.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'restrict' }),
    localId: uuid('local_id').references(() => local.id, { onDelete: 'set null' }),
    validatedBy: uuid('validated_by').references(() => user.id, { onDelete: 'set null' }),
    result: varchar('result', { length: 16 }).notNull(),
    method: varchar('method', { length: 16 }).notNull().default('scan'),
    deviceInfo: varchar('device_info', { length: 255 }),
    scannedAt: timestamp('scanned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_qr_validation_ticket').on(t.ticketId),
    check(
      'qr_validation_result_check',
      sql`${t.result} in ('valid','already_used','cancelled','invalid')`,
    ),
  ],
);

export type Order = typeof order.$inferSelect;
export type TicketHold = typeof ticketHold.$inferSelect;
export type OrderItem = typeof orderItem.$inferSelect;
export type Payment = typeof payment.$inferSelect;
export type Ticket = typeof ticket.$inferSelect;
export type Attendee = typeof attendee.$inferSelect;
