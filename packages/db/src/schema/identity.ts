import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
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
// FK multi-tenant (M13): company/local viven en el módulo 3, event en el 4.
// Las referencias usan la forma perezosa `() => tabla.id`, por lo que el import
// circular identity ↔ companies/events es seguro (ninguna tabla se accede en
// tiempo de evaluación del módulo, solo dentro del callback de Drizzle).
import { company, local } from './companies';
import { event } from './events';

/**
 * Dominio 1 — Identity, Access & Legal (§4.1).
 * Convenciones §2.3: tabla snake_case singular, UUID PK (gen_random_uuid),
 * varchar + CHECK en lugar de pg_enum, índices `idx_<tabla>_<col>`.
 *
 * Multi-tenant (M13): user_role.company_id/local_id referencian COMPANY/LOCAL
 * (módulo 3) con FK real. Se cierra la integridad referencial de scope que las
 * migraciones 0002-0009 dejaron pendiente (antes eran uuid sueltos).
 */
export const user = pgTable(
  'user',
  {
    id: id(),
    fullName: varchar('full_name', { length: 120 }).notNull(),
    email: varchar('email', { length: 160 }).notNull(),
    passwordHash: varchar('password_hash', { length: 100 }), // null cuando OAuth only
    authProvider: varchar('auth_provider', { length: 10 }).notNull().default('email'),
    googleSub: varchar('google_sub', { length: 255 }), // OAuth subject, nullable
    documentType: varchar('document_type', { length: 10 }), // dni|ce|passport, nullable hasta onboarding
    documentNumber: varchar('document_number', { length: 20 }), // UK, locked tras 1ª compra (Checkout)
    birthDate: date('birth_date'), // 18+ validado en dominio/contracts (no DB: current_date no es IMMUTABLE)
    phone: varchar('phone', { length: 20 }),
    avatarUrl: varchar('avatar_url', { length: 512 }),
    emailVerified: boolean('email_verified').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_user_email').on(t.email),
    uniqueIndex('idx_user_google_sub').on(t.googleSub),
    uniqueIndex('idx_user_document_number').on(t.documentNumber),
    check('user_auth_provider_check', sql`${t.authProvider} in ('email','google')`),
    check(
      'user_document_type_check',
      sql`${t.documentType} is null or ${t.documentType} in ('dni','ce','passport')`,
    ),
  ],
);

export const userMfaFactor = pgTable(
  'user_mfa_factor',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 10 }).notNull(),
    secretEncrypted: varchar('secret_encrypted', { length: 255 }).notNull(),
    status: varchar('status', { length: 10 }).notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index('idx_user_mfa_factor_user').on(t.userId),
    uniqueIndex('idx_user_mfa_factor_user_type_current')
      .on(t.userId, t.type)
      .where(sql`${t.status} <> 'revoked'`),
    check('user_mfa_factor_type_check', sql`${t.type} in ('totp')`),
    check(
      'user_mfa_factor_status_check',
      sql`${t.status} in ('pending','active','revoked')`,
    ),
  ],
);

export const userRecoveryCode = pgTable(
  'user_recovery_code',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    codeHash: varchar('code_hash', { length: 100 }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_user_recovery_code_user').on(t.userId)],
);

export const mfaUnlockOperator = pgTable(
  'mfa_unlock_operator',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    grantedBy: uuid('granted_by')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_mfa_unlock_operator_granted_by').on(t.grantedBy)],
);

export const role = pgTable(
  'role',
  {
    id: id(),
    code: varchar('code', { length: 20 }).notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    description: varchar('description', { length: 255 }),
    permissions: jsonb('permissions').notNull().default(sql`'{}'::jsonb`),
  },
  (t) => [
    uniqueIndex('idx_role_code').on(t.code),
    check(
      'role_code_check',
      sql`${t.code} in ('user','admin_local','promoter','validator','super_admin')`,
    ),
  ],
);

export const userRole = pgTable(
  'user_role',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => role.id, { onDelete: 'restrict' }),
    // Scope multi-tenant (nullable): grant a nivel empresa/local. FK con cascade:
    // al borrar el tenant se retira el grant scoped (M13).
    companyId: uuid('company_id').references(() => company.id, { onDelete: 'cascade' }),
    localId: uuid('local_id').references(() => local.id, { onDelete: 'cascade' }),
    isActive: boolean('is_active').notNull().default(true),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
    grantedBy: uuid('granted_by').references(() => user.id, { onDelete: 'set null' }),
  },
  (t) => [index('idx_user_role_user').on(t.userId)],
);

export const userPreference = pgTable(
  'user_preference',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
    acceptsMarketing: boolean('accepts_marketing').notNull().default(false),
    acceptsReminders: boolean('accepts_reminders').notNull().default(true),
    preferredLocale: varchar('preferred_locale', { length: 10 }).notNull().default('es-PE'),
    ...timestamps(),
  },
  (t) => [uniqueIndex('idx_user_preference_user').on(t.userId)],
);

export const legalDocument = pgTable(
  'legal_document',
  {
    id: id(),
    docType: varchar('doc_type', { length: 20 }).notNull(),
    version: varchar('version', { length: 20 }).notNull(),
    contentUrl: text('content_url').notNull(),
    isCurrent: boolean('is_current').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_legal_document_type_version').on(t.docType, t.version),
    // Solo un documento "current" por tipo (invariante de negocio en DB).
    uniqueIndex('idx_legal_document_current')
      .on(t.docType)
      .where(sql`${t.isCurrent}`),
    check(
      'legal_document_doc_type_check',
      sql`${t.docType} in ('terms','privacy','refund_policy')`,
    ),
  ],
);

export const legalAcceptance = pgTable(
  'legal_acceptance',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    legalDocumentId: uuid('legal_document_id')
      .notNull()
      .references(() => legalDocument.id, { onDelete: 'restrict' }),
    versionAccepted: varchar('version_accepted', { length: 20 }).notNull(), // denormalizado p/ auditoría
    ipAddress: varchar('ip_address', { length: 45 }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('idx_legal_acceptance_user_doc').on(t.userId, t.legalDocumentId)],
);

/**
 * Favorito polimórfico (§4.3: "exactamente uno de local_id/event_id").
 * local_id/event_id referencian LOCAL (módulo 3) y EVENT (módulo 4) con FK real
 * (M13): al borrar el target se elimina el favorito (cascade).
 * Doble índice único parcial → no se puede marcar dos veces el mismo target.
 */
export const userFavorite = pgTable(
  'user_favorite',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    targetType: varchar('target_type', { length: 8 }).notNull(),
    localId: uuid('local_id').references(() => local.id, { onDelete: 'cascade' }), // FK → local (módulo 3), polimórfico
    eventId: uuid('event_id').references(() => event.id, { onDelete: 'cascade' }), // FK → event (módulo 4), polimórfico
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_user_favorite_user').on(t.userId),
    uniqueIndex('idx_user_favorite_user_local')
      .on(t.userId, t.localId)
      .where(sql`${t.localId} is not null`),
    uniqueIndex('idx_user_favorite_user_event')
      .on(t.userId, t.eventId)
      .where(sql`${t.eventId} is not null`),
    check('user_favorite_target_type_check', sql`${t.targetType} in ('local','event')`),
    check(
      'user_favorite_target_one_of_check',
      sql`(${t.localId} is not null and ${t.eventId} is null) or (${t.localId} is null and ${t.eventId} is not null)`,
    ),
  ],
);

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type UserMfaFactor = typeof userMfaFactor.$inferSelect;
export type NewUserMfaFactor = typeof userMfaFactor.$inferInsert;
export type UserRecoveryCode = typeof userRecoveryCode.$inferSelect;
export type NewUserRecoveryCode = typeof userRecoveryCode.$inferInsert;
export type MfaUnlockOperator = typeof mfaUnlockOperator.$inferSelect;
export type Role = typeof role.$inferSelect;
export type UserRole = typeof userRole.$inferSelect;
export type UserPreference = typeof userPreference.$inferSelect;
export type LegalDocument = typeof legalDocument.$inferSelect;
export type LegalAcceptance = typeof legalAcceptance.$inferSelect;
export type UserFavorite = typeof userFavorite.$inferSelect;
export type NewUserFavorite = typeof userFavorite.$inferInsert;
