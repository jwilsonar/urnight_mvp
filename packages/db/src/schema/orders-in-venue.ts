import { sql } from 'drizzle-orm';
import {
  check,
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
import { user } from './identity';
import { menuProduct } from './menu';

/**
 * Pedidos in-venue vive separado de `menu.ts`: la carta define catálogo,
 * precios y horarios; este archivo concentra el ciclo transaccional del pedido.
 */
export const localOrder = pgTable(
  'local_order',
  {
    id: id(),
    localId: uuid('local_id')
      .notNull()
      .references(() => local.id, { onDelete: 'restrict' }),
    userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
    attendeeName: varchar('attendee_name', { length: 120 }).notNull(),
    pickupCode: varchar('pickup_code', { length: 8 }).notNull(),
    pickupZone: varchar('pickup_zone', { length: 120 }).notNull(),
    status: varchar('status', { length: 16 }).notNull().default('received'),
    paymentMethod: varchar('payment_method', { length: 16 }).notNull(),
    paymentStatus: varchar('payment_status', { length: 12 }).notNull().default('pending'),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('PEN'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index('idx_local_order_local').on(t.localId),
    index('idx_local_order_user').on(t.userId),
    uniqueIndex('idx_local_order_local_pickup_code_open')
      .on(t.localId, t.pickupCode)
      .where(sql`${t.status} in ('received','preparing','ready')`),
    check(
      'local_order_status_check',
      sql`${t.status} in ('received','preparing','ready','delivered','cancelled')`,
    ),
    check(
      'local_order_payment_method_check',
      sql`${t.paymentMethod} in ('wallet','card','cash_register')`,
    ),
    check(
      'local_order_payment_status_check',
      sql`${t.paymentStatus} in ('pending','paid','refunded')`,
    ),
  ],
);

export const localOrderItem = pgTable(
  'local_order_item',
  {
    id: id(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => localOrder.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => menuProduct.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    unitAmount: numeric('unit_amount', { precision: 10, scale: 2 }).notNull(),
    lineAmount: numeric('line_amount', { precision: 10, scale: 2 }).notNull(),
    ...timestamps(),
  },
  (t) => [
    index('idx_local_order_item_order').on(t.orderId),
    index('idx_local_order_item_product').on(t.productId),
    check('local_order_item_quantity_check', sql`${t.quantity} > 0`),
  ],
);

export const localOrderSplit = pgTable(
  'local_order_split',
  {
    id: id(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => localOrder.id, { onDelete: 'cascade' }),
    shareToken: varchar('share_token', { length: 64 }).notNull(),
    expectedTotal: numeric('expected_total', { precision: 10, scale: 2 }).notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_local_order_split_order').on(t.orderId),
    uniqueIndex('idx_local_order_split_share_token').on(t.shareToken),
  ],
);

export const localOrderSplitPayment = pgTable(
  'local_order_split_payment',
  {
    id: id(),
    splitId: uuid('split_id')
      .notNull()
      .references(() => localOrderSplit.id, { onDelete: 'cascade' }),
    payerName: varchar('payer_name', { length: 120 }).notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }).notNull(),
    ...timestamps(),
  },
  (t) => [index('idx_local_order_split_payment_split').on(t.splitId)],
);

export type LocalOrderRow = typeof localOrder.$inferSelect;
export type LocalOrderItemRow = typeof localOrderItem.$inferSelect;
export type LocalOrderSplitRow = typeof localOrderSplit.$inferSelect;
export type LocalOrderSplitPaymentRow = typeof localOrderSplitPayment.$inferSelect;
