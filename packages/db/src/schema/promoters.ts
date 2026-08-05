import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
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
import { id } from '../helpers';
import { zone } from './catalog';
import { company, local } from './companies';
import { order } from './checkout';
import { event, ticketType } from './events';
import { user } from './identity';

/** Dominio 6 — Promoters, Referrals & Promo Codes (§4.1). */
export const promoter = pgTable(
  'promoter',
  {
    id: id(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    localId: uuid('local_id').references(() => local.id, { onDelete: 'set null' }),
    userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
    parentPromoterId: uuid('parent_promoter_id').references((): AnyPgColumn => promoter.id, {
      onDelete: 'set null',
    }),
    name: varchar('name', { length: 160 }).notNull(),
    contactEmail: varchar('contact_email', { length: 160 }),
    contactPhone: varchar('contact_phone', { length: 20 }),
    /** Correo de la persona invitada; clave de match hasta que confirme (user_id). */
    invitedEmail: varchar('invited_email', { length: 160 }),
    status: varchar('status', { length: 12 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_promoter_company').on(t.companyId),
    index('idx_promoter_parent').on(t.parentPromoterId),
    check(
      'promoter_status_check',
      sql`${t.status} in ('active','inactive','suspended','pending')`,
    ),
  ],
);

/** Politica opcional de comision en cascada por local. Apagada por defecto. */
export const promoterLocalPolicy = pgTable(
  'promoter_local_policy',
  {
    id: id(),
    localId: uuid('local_id')
      .notNull()
      .references(() => local.id, { onDelete: 'cascade' }),
    cascadeEnabled: boolean('cascade_enabled').notNull().default(false),
    cascadePercentage: numeric('cascade_percentage', { precision: 5, scale: 2 })
      .notNull()
      .default('0'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_promoter_local_policy_local').on(t.localId),
    check(
      'promoter_local_policy_cascade_percentage_check',
      sql`${t.cascadePercentage} >= 0 and ${t.cascadePercentage} <= 100`,
    ),
  ],
);

export const referralLink = pgTable(
  'referral_link',
  {
    id: id(),
    promoterId: uuid('promoter_id')
      .notNull()
      .references(() => promoter.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 12 }).notNull(),
    url: varchar('url', { length: 255 }).notNull(),
    clicks: integer('clicks').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_referral_link_code').on(t.code),
    uniqueIndex('idx_referral_link_promoter').on(t.promoterId),
  ],
);

export const promoterApplication = pgTable(
  'promoter_application',
  {
    id: id(),
    localId: uuid('local_id').references(() => local.id, { onDelete: 'set null' }),
    eventId: uuid('event_id').references(() => event.id, { onDelete: 'set null' }),
    applicantUserId: uuid('applicant_user_id').references(() => user.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 160 }).notNull(),
    contactEmail: varchar('contact_email', { length: 160 }),
    contactPhone: varchar('contact_phone', { length: 20 }),
    socials: varchar('socials', { length: 512 }),
    status: varchar('status', { length: 12 }).notNull().default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
    createdPromoterId: uuid('created_promoter_id').references(() => promoter.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (t) => [
    check(
      'promoter_application_status_check',
      sql`${t.status} in ('pending','approved','rejected')`,
    ),
  ],
);

export const saleAttribution = pgTable(
  'sale_attribution',
  {
    id: id(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => order.id, { onDelete: 'cascade' }),
    promoterId: uuid('promoter_id')
      .notNull()
      .references(() => promoter.id, { onDelete: 'cascade' }),
    referralLinkId: uuid('referral_link_id').references(() => referralLink.id, {
      onDelete: 'set null',
    }),
    commissionRate: numeric('commission_rate', { precision: 5, scale: 4 }).notNull(),
    commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }).notNull(),
    /** Snapshot adicional del cabeza; nunca reduce commission_amount del vendedor. */
    headPromoterId: uuid('head_promoter_id').references(() => promoter.id, {
      onDelete: 'set null',
    }),
    headCommissionRate: numeric('head_commission_rate', {
      precision: 5,
      scale: 4,
    }),
    headCommissionAmount: numeric('head_commission_amount', {
      precision: 10,
      scale: 2,
    }),
    status: varchar('status', { length: 12 }).notNull().default('estimated'),
    attributedAt: timestamp('attributed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_sale_attribution_order').on(t.orderId),
    index('idx_sale_attribution_promoter').on(t.promoterId),
    index('idx_sale_attribution_head_promoter').on(t.headPromoterId),
    check(
      'sale_attribution_head_commission_rate_check',
      sql`${t.headCommissionRate} is null or (${t.headCommissionRate} >= 0 and ${t.headCommissionRate} <= 1)`,
    ),
    check('sale_attribution_status_check', sql`${t.status} in ('estimated','confirmed','void')`),
  ],
);

export const promoCode = pgTable(
  'promo_code',
  {
    id: id(),
    code: varchar('code', { length: 40 }).notNull(),
    discountType: varchar('discount_type', { length: 14 }).notNull(),
    discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
    usageQuota: integer('usage_quota'),
    usedCount: integer('used_count').notNull().default(0),
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    scope: varchar('scope', { length: 12 }).notNull().default('global'),
    eventId: uuid('event_id').references(() => event.id, { onDelete: 'cascade' }),
    localId: uuid('local_id').references(() => local.id, { onDelete: 'cascade' }),
    zoneId: uuid('zone_id').references(() => zone.id, { onDelete: 'set null' }),
    promoterId: uuid('promoter_id').references(() => promoter.id, { onDelete: 'set null' }),
    ticketTypeId: uuid('ticket_type_id').references(() => ticketType.id, { onDelete: 'cascade' }),
    /** Asignación promotor↔evento de la que nació este código (códigos generados por el promotor). */
    promoterEventId: uuid('promoter_event_id').references(() => promoterEvent.id, {
      onDelete: 'set null',
    }),
    createdBy: uuid('created_by').references(() => user.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').notNull().default(true),
    /** Clics del enlace corto /p/<code> (espejo de referral_link.clicks). */
    clicks: integer('clicks').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_promo_code_code').on(t.code),
    index('idx_promo_code_promoter_event').on(t.promoterId, t.eventId),
    check('promo_code_discount_type_check', sql`${t.discountType} in ('percentage','fixed_amount')`),
    check(
      'promo_code_scope_check',
      sql`${t.scope} in ('global','event','local','zone','promoter','ticket_type')`,
    ),
  ],
);

export const promoCodeRedemption = pgTable(
  'promo_code_redemption',
  {
    id: id(),
    promoCodeId: uuid('promo_code_id')
      .notNull()
      .references(() => promoCode.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => order.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    discountApplied: numeric('discount_applied', { precision: 10, scale: 2 }).notNull(),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_promo_code_redemption_code').on(t.promoCodeId),
    // Límite de canje por usuario (M1): un mismo código no se canjea dos veces por
    // el mismo usuario. Barrera en DB; el chequeo de app lo añade el módulo promoters.
    uniqueIndex('idx_promo_code_redemption_code_user').on(t.promoCodeId, t.userId),
  ],
);

/**
 * Asignación admin → promotor de un evento a promocionar. Cabecera; el detalle
 * (descuento + cupo por tipo de entrada) vive en promoter_ticket_allocation.
 */
export const promoterEvent = pgTable(
  'promoter_event',
  {
    id: id(),
    promoterId: uuid('promoter_id')
      .notNull()
      .references(() => promoter.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 12 }).notNull().default('active'),
    assignedBy: uuid('assigned_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_promoter_event_unique').on(t.promoterId, t.eventId),
    index('idx_promoter_event_promoter').on(t.promoterId),
    index('idx_promoter_event_event').on(t.eventId),
    check('promoter_event_status_check', sql`${t.status} in ('active','revoked')`),
  ],
);

/**
 * Cupo de entradas gratis + descuento por tipo de entrada que el admin concede al
 * promotor para un evento asignado. allocated_stock acota cuántos códigos puede generar.
 */
export const promoterTicketAllocation = pgTable(
  'promoter_ticket_allocation',
  {
    id: id(),
    promoterEventId: uuid('promoter_event_id')
      .notNull()
      .references(() => promoterEvent.id, { onDelete: 'cascade' }),
    ticketTypeId: uuid('ticket_type_id')
      .notNull()
      .references(() => ticketType.id, { onDelete: 'cascade' }),
    discountType: varchar('discount_type', { length: 14 }).notNull().default('percentage'),
    /** 100 = entrada gratis (MVP). Se honra cualquier % cuando entre la pasarela de pagos. */
    discountValue: numeric('discount_value', { precision: 5, scale: 2 }).notNull().default('100'),
    /** Cupo de entradas que el promotor puede repartir para este tipo. */
    allocatedStock: integer('allocated_stock').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_promoter_alloc_unique').on(t.promoterEventId, t.ticketTypeId),
    check(
      'promoter_alloc_discount_type_check',
      sql`${t.discountType} in ('percentage','fixed_amount')`,
    ),
  ],
);

export type Promoter = typeof promoter.$inferSelect;
export type PromoterLocalPolicy = typeof promoterLocalPolicy.$inferSelect;
export type ReferralLink = typeof referralLink.$inferSelect;
export type PromoCode = typeof promoCode.$inferSelect;
export type SaleAttribution = typeof saleAttribution.$inferSelect;
export type PromoterEvent = typeof promoterEvent.$inferSelect;
export type PromoterTicketAllocation = typeof promoterTicketAllocation.$inferSelect;
