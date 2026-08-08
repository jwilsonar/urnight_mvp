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
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { id, timestamps } from '../helpers';
import { local } from './companies';

/** Catálogo de carta del local. Persiste referencias de imagen como keys de S3. */
export const menuCategory = pgTable(
  'menu_category',
  {
    id: id(),
    localId: uuid('local_id')
      .notNull()
      .references(() => local.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    displayOrder: integer('display_order').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    index('idx_menu_category_local').on(t.localId),
    uniqueIndex('idx_menu_category_local_name').on(t.localId, t.name),
  ],
);

export const menuProduct = pgTable(
  'menu_product',
  {
    id: id(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => menuCategory.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 160 }).notNull(),
    description: text('description'),
    /** Key estable del objeto en S3; la URL se resuelve en la capa HTTP. */
    imageKey: varchar('image_key', { length: 512 }),
    isAvailable: boolean('is_available').notNull().default(true),
    tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    ...timestamps(),
  },
  (t) => [index('idx_menu_product_category').on(t.categoryId)],
);

/** Historial de precios. Solo una fila sin valid_to puede estar vigente. */
export const menuProductPrice = pgTable(
  'menu_product_price',
  {
    id: id(),
    productId: uuid('product_id')
      .notNull()
      .references(() => menuProduct.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('PEN'),
    validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
    validTo: timestamp('valid_to', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index('idx_menu_product_price_product').on(t.productId),
    uniqueIndex('idx_menu_product_price_product_current')
      .on(t.productId)
      .where(sql`${t.validTo} is null`),
  ],
);

/**
 * Si ends_at es menor que starts_at, la ventana cruza medianoche y termina al
 * día siguiente. Ese caso es válido y deliberadamente no tiene CHECK de orden.
 */
export const localOrderWindow = pgTable(
  'local_order_window',
  {
    id: id(),
    localId: uuid('local_id')
      .notNull()
      .references(() => local.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    startsAt: time('starts_at').notNull(),
    endsAt: time('ends_at').notNull(),
    ...timestamps(),
  },
  (t) => [
    index('idx_local_order_window_local').on(t.localId),
    check('local_order_window_day_of_week_check', sql`${t.dayOfWeek} between 0 and 6`),
  ],
);

export const localPolicy = pgTable(
  'local_policy',
  {
    id: id(),
    localId: uuid('local_id')
      .notNull()
      .references(() => local.id, { onDelete: 'cascade' }),
    reservationDepositPercent: integer('reservation_deposit_percent').notNull(),
    birthdayWindowDays: integer('birthday_window_days').notNull().default(1),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_local_policy_local').on(t.localId),
    check(
      'local_policy_reservation_deposit_percent_check',
      sql`${t.reservationDepositPercent} between 0 and 100 and ${t.reservationDepositPercent} % 5 = 0`,
    ),
  ],
);

export type MenuCategoryRow = typeof menuCategory.$inferSelect;
export type MenuProductRow = typeof menuProduct.$inferSelect;
export type MenuProductPriceRow = typeof menuProductPrice.$inferSelect;
export type LocalOrderWindowRow = typeof localOrderWindow.$inferSelect;
export type LocalPolicyRow = typeof localPolicy.$inferSelect;
