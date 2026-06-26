import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { id, timestamps } from '../helpers';
import { tag, localType, musicGenre, zone } from './catalog';
import { user } from './identity';

/**
 * Dominio 3 — Companies & Locals (multi-tenant §4.1). company es el ancla de
 * tenant; local cuelga de company y zone. varchar + CHECK para estados.
 */
export const company = pgTable(
  'company',
  {
    id: id(),
    legalName: varchar('legal_name', { length: 200 }).notNull(),
    ruc: varchar('ruc', { length: 11 }).notNull(),
    commercialName: varchar('commercial_name', { length: 200 }).notNull(),
    contactEmail: varchar('contact_email', { length: 160 }),
    contactPhone: varchar('contact_phone', { length: 20 }),
    status: varchar('status', { length: 12 }).notNull().default('draft'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_company_ruc').on(t.ruc),
    check('company_status_check', sql`${t.status} in ('draft','active','suspended')`),
  ],
);

export const local = pgTable(
  'local',
  {
    id: id(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    zoneId: uuid('zone_id').references(() => zone.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 180 }).notNull(),
    description: text('description'),
    address: varchar('address', { length: 255 }),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    googleMapsUrl: varchar('google_maps_url', { length: 512 }),
    openingHours: jsonb('opening_hours'),
    socials: varchar('socials', { length: 512 }),
    // Referencia de la portada: key de S3 (objetos gestionados) o URL absoluta
    // (imágenes externas/seed). Se resuelve a URL pública en lectura (StoragePort).
    mainImageKey: varchar('main_image_key', { length: 512 }),
    status: varchar('status', { length: 12 }).notNull().default('draft'),
    suspensionReason: varchar('suspension_reason', { length: 255 }),
    isVerified: boolean('is_verified').notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_local_slug').on(t.slug),
    index('idx_local_company').on(t.companyId),
    index('idx_local_zone').on(t.zoneId),
    check('local_status_check', sql`${t.status} in ('draft','active','inactive','suspended')`),
  ],
);

export const localImage = pgTable(
  'local_image',
  {
    id: id(),
    localId: uuid('local_id')
      .notNull()
      .references(() => local.id, { onDelete: 'cascade' }),
    // Key de S3 del objeto (o URL absoluta para imágenes externas/seed). La URL
    // pública se construye en lectura vía StoragePort.resolveUrl (no se persiste).
    storageKey: varchar('storage_key', { length: 512 }).notNull(),
    isMain: boolean('is_main').notNull().default(false),
    sortOrder: doublePrecision('sort_order').notNull().default(0),
    width: doublePrecision('width'),
    height: doublePrecision('height'),
    sizeBytes: doublePrecision('size_bytes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_local_image_local').on(t.localId)],
);

export const localVerification = pgTable(
  'local_verification',
  {
    id: id(),
    localId: uuid('local_id')
      .notNull()
      .references(() => local.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 12 }).notNull().default('pending'),
    licenseReference: varchar('license_reference', { length: 120 }),
    documentUrl: varchar('document_url', { length: 512 }),
    notes: varchar('notes', { length: 500 }),
    verifiedBy: uuid('verified_by').references(() => user.id, { onDelete: 'set null' }),
    validUntil: date('valid_until'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_local_verification_local').on(t.localId),
    check(
      'local_verification_status_check',
      sql`${t.status} in ('pending','approved','observed','expired')`,
    ),
  ],
);

export const affiliationRequest = pgTable(
  'affiliation_request',
  {
    id: id(),
    legalName: varchar('legal_name', { length: 200 }).notNull(),
    ruc: varchar('ruc', { length: 11 }).notNull(),
    commercialName: varchar('commercial_name', { length: 200 }).notNull(),
    zoneId: uuid('zone_id').references(() => zone.id, { onDelete: 'set null' }),
    address: varchar('address', { length: 255 }),
    socials: varchar('socials', { length: 512 }),
    contactName: varchar('contact_name', { length: 160 }),
    contactEmail: varchar('contact_email', { length: 160 }),
    contactPhone: varchar('contact_phone', { length: 20 }),
    status: varchar('status', { length: 12 }).notNull().default('pending'),
    rejectionReason: varchar('rejection_reason', { length: 255 }),
    submittedBy: uuid('submitted_by').references(() => user.id, { onDelete: 'set null' }),
    reviewedBy: uuid('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
    companyId: uuid('company_id').references(() => company.id, { onDelete: 'set null' }),
    localId: uuid('local_id').references(() => local.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (t) => [
    check(
      'affiliation_request_status_check',
      sql`${t.status} in ('pending','approved','rejected')`,
    ),
  ],
);

// Clasificación M:N del local (catálogos). Sin endpoints dedicados en el MVP.
export const localLocalType = pgTable(
  'local_local_type',
  {
    id: id(),
    localId: uuid('local_id')
      .notNull()
      .references(() => local.id, { onDelete: 'cascade' }),
    localTypeId: uuid('local_type_id')
      .notNull()
      .references(() => localType.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('idx_local_local_type').on(t.localId, t.localTypeId)],
);

export const localGenre = pgTable(
  'local_genre',
  {
    id: id(),
    localId: uuid('local_id')
      .notNull()
      .references(() => local.id, { onDelete: 'cascade' }),
    genreId: uuid('genre_id')
      .notNull()
      .references(() => musicGenre.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('idx_local_genre').on(t.localId, t.genreId)],
);

export const localTag = pgTable(
  'local_tag',
  {
    id: id(),
    localId: uuid('local_id')
      .notNull()
      .references(() => local.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tag.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('idx_local_tag').on(t.localId, t.tagId)],
);

export type Company = typeof company.$inferSelect;
export type Local = typeof local.$inferSelect;
export type LocalVerification = typeof localVerification.$inferSelect;
export type AffiliationRequest = typeof affiliationRequest.$inferSelect;
