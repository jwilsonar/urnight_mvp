/**
 * Seed de datos de prueba — UrNight MVP.
 *
 * Genera un dataset extenso y coherente que cubre las 43 tablas del DER
 * (8 bounded contexts) respetando TODAS las invariantes/CHECK del esquema:
 *  - 18+ en user/attendee, document_number único
 *  - sold <= stock por ticket_type
 *  - qr_code único e impredecible
 *  - review verificada solo desde ticket 'used'
 *  - target polimórfico exclusivo (local|event) en review/report
 *  - atribución única por order, un referral_link por promoter
 *  - snapshots de precio/comisión denormalizados
 *
 * Idempotente: TRUNCATE ... CASCADE de todas las tablas de la app y reinserta.
 *
 * Ejecutar:  pnpm --filter @urnight/db db:seed
 *
 * Las contraseñas se hashean con bcryptjs (mismas rounds=12 que la API),
 * de modo que las credenciales funcionan en el login real.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createDbClient, schema } from './index';

// .env vive en la raíz del monorepo; cwd al correr scripts = packages/db.
config({ path: '../../.env' });

const DATABASE_URL = process.env.DATABASE_URL ?? '';
if (!DATABASE_URL) {
  console.error('✖ DATABASE_URL no definido. Revisa la raíz/.env');
  process.exit(1);
}

// ── Helpers ────────────────────────────────────────────────────────────────
const uid = () => randomUUID();
const qr = () => randomBytes(24).toString('hex'); // 48 chars hex (<=64), impredecible
const N = (n: number) => n.toFixed(2); // numeric(10,2) → string
const RATE = (n: number) => n.toFixed(4); // numeric(5,4) → string

const NOW = new Date();
const day = 24 * 60 * 60 * 1000;
const daysFromNow = (d: number) => new Date(NOW.getTime() + d * day);
const at = (date: Date, h: number, m = 0) => {
  const x = new Date(date);
  x.setHours(h, m, 0, 0);
  return x;
};

// Contraseña común de demo (cumple política: 8+, mayús, minús, dígito, símbolo).
const DEMO_PASSWORD = 'Urnight2026!';

async function main() {
  const { db, sql } = createDbClient(DATABASE_URL);
  console.log('→ Conectado a', DATABASE_URL.replace(/:[^:@/]+@/, ':****@'));

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── 0. Limpieza (orden irrelevante con CASCADE) ───────────────────────────
  console.log('→ Truncando tablas...');
  await sql/* sql */ `
    TRUNCATE TABLE
      "audit_log","platform_setting","support_ticket","notification","analytics_event","pilot_feedback",
      "review","report",
      "sale_attribution","promo_code_redemption","promo_code","referral_link","promoter_application","promoter",
      "qr_validation","attendee","ticket","payment","order_item","order",
      "event_tag","event_genre","event_image","ticket_type","event",
      "local_tag","local_genre","local_local_type","affiliation_request","local_verification","local_image","local","company",
      "tag","music_genre","local_type","zone",
      "legal_acceptance","legal_document","user_preference","user_role","role","user"
    RESTART IDENTITY CASCADE;
  `;

  const {
    user,
    role,
    userRole,
    userPreference,
    legalDocument,
    legalAcceptance,
    zone,
    localType,
    musicGenre,
    tag,
    company,
    local,
    localImage,
    localVerification,
    affiliationRequest,
    localLocalType,
    localGenre,
    localTag,
    event,
    ticketType,
    eventImage,
    eventGenre,
    eventTag,
    order,
    orderItem,
    payment,
    ticket,
    attendee,
    qrValidation,
    promoter,
    referralLink,
    promoterApplication,
    saleAttribution,
    promoCode,
    promoCodeRedemption,
    review,
    report,
    auditLog,
    platformSetting,
    supportTicket,
    notification,
    analyticsEvent,
    pilotFeedback,
  } = schema;

  // ── 1. Identity, Access & Legal ───────────────────────────────────────────
  console.log('→ Identity (users, roles, legal)...');

  // Roles (5 del RBAC, §5)
  const roleId = {
    user: uid(),
    admin_local: uid(),
    promoter: uid(),
    validator: uid(),
    super_admin: uid(),
  };
  await db.insert(role).values([
    {
      id: roleId.super_admin,
      code: 'super_admin',
      name: 'Super Administrador',
      description: 'Acceso total a la plataforma',
      permissions: { '*': true },
    },
    {
      id: roleId.admin_local,
      code: 'admin_local',
      name: 'Administrador de Local',
      description: 'Gestiona su company, locales y eventos',
      permissions: { local: ['read', 'write'], event: ['read', 'write'], promoter: ['read', 'write'] },
    },
    {
      id: roleId.promoter,
      code: 'promoter',
      name: 'Promotor',
      description: 'Genera ventas con links de referido',
      permissions: { sales: ['read'], referral: ['read'] },
    },
    {
      id: roleId.validator,
      code: 'validator',
      name: 'Validador de Puerta',
      description: 'Escanea QR en el ingreso del evento',
      permissions: { qr: ['validate'] },
    },
    {
      id: roleId.user,
      code: 'user',
      name: 'Usuario',
      description: 'Consumidor: explora catálogo y compra entradas',
      permissions: { catalog: ['read'], order: ['read', 'write'] },
    },
  ]);

  // Usuarios. Helper para armar el objeto.
  type Seedish = {
    id: string;
    fullName: string;
    email: string;
    docType?: 'dni' | 'ce' | 'passport';
    docNumber?: string;
    birthDate: string;
    phone?: string;
    google?: boolean;
  };
  const mkUser = (u: Seedish) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    passwordHash: u.google ? null : passwordHash,
    authProvider: u.google ? 'google' : 'email',
    googleSub: u.google ? `google-oauth2|${randomBytes(8).toString('hex')}` : null,
    documentType: u.docType ?? null,
    documentNumber: u.docNumber ?? null,
    birthDate: u.birthDate,
    phone: u.phone ?? null,
    avatarUrl: `https://i.pravatar.cc/240?u=${encodeURIComponent(u.email)}`,
    emailVerified: true,
    isActive: true,
    lastLoginAt: daysFromNow(-1),
  });

  const U = {
    superAdmin: uid(),
    ownerA: uid(),
    ownerB: uid(),
    promoterA: uid(),
    promoterB: uid(),
    validatorA: uid(),
    validatorB: uid(),
    sofia: uid(),
    mateo: uid(),
    valentina: uid(),
    lucia: uid(),
    carlos: uid(),
    daniela: uid(),
  };

  await db.insert(user).values([
    mkUser({ id: U.superAdmin, fullName: 'Renzo Salcedo', email: 'admin@urnight.pe', docType: 'dni', docNumber: '40000001', birthDate: '1990-03-15', phone: '+51999000001' }),
    mkUser({ id: U.ownerA, fullName: 'Carla Mendoza', email: 'owner.nocturna@urnight.pe', docType: 'dni', docNumber: '40000002', birthDate: '1988-07-22', phone: '+51999000002' }),
    mkUser({ id: U.ownerB, fullName: 'Diego Vargas', email: 'owner.beats@urnight.pe', docType: 'dni', docNumber: '40000003', birthDate: '1985-11-02', phone: '+51999000003' }),
    mkUser({ id: U.promoterA, fullName: 'Andrea Flores', email: 'promoter@urnight.pe', docType: 'dni', docNumber: '40000004', birthDate: '1995-05-30', phone: '+51999000004' }),
    mkUser({ id: U.promoterB, fullName: 'Luis Quispe', email: 'promoter2@urnight.pe', docType: 'dni', docNumber: '40000010', birthDate: '1997-01-12', phone: '+51999000010' }),
    mkUser({ id: U.validatorA, fullName: 'José Ramírez', email: 'validator@urnight.pe', docType: 'dni', docNumber: '40000005', birthDate: '1993-09-08', phone: '+51999000005' }),
    mkUser({ id: U.validatorB, fullName: 'María Torres', email: 'validator2@urnight.pe', docType: 'dni', docNumber: '40000011', birthDate: '1996-04-19', phone: '+51999000011' }),
    mkUser({ id: U.sofia, fullName: 'Sofía Castro', email: 'user@urnight.pe', docType: 'dni', docNumber: '40000006', birthDate: '1998-02-14', phone: '+51999000006' }),
    mkUser({ id: U.mateo, fullName: 'Mateo Rojas', email: 'user2@urnight.pe', docType: 'dni', docNumber: '40000007', birthDate: '1999-12-01', phone: '+51999000007' }),
    mkUser({ id: U.valentina, fullName: 'Valentina Díaz', email: 'user3@urnight.pe', docType: 'ce', docNumber: '001234567', birthDate: '2000-06-25', phone: '+51999000008' }),
    mkUser({ id: U.lucia, fullName: 'Lucía Paredes', email: 'lucia.paredes@gmail.com', docType: 'dni', docNumber: '40000009', birthDate: '1994-08-08', phone: '+51999000009', google: true }),
    mkUser({ id: U.carlos, fullName: 'Carlos Núñez', email: 'user5@urnight.pe', docType: 'dni', docNumber: '40000012', birthDate: '1992-10-17', phone: '+51999000012' }),
    mkUser({ id: U.daniela, fullName: 'Daniela Ríos', email: 'user6@urnight.pe', docType: 'dni', docNumber: '40000013', birthDate: '2001-03-03', phone: '+51999000013' }),
  ]);

  // user_role (RBAC con scope multi-tenant). companyId/localId se setean abajo
  // con ids estables → los defino antes de companies para referenciarlos.
  const C = { a: uid(), b: uid(), c: uid() };
  const L = { a1: uid(), a2: uid(), b1: uid(), b2: uid() };

  await db.insert(userRole).values([
    { userId: U.superAdmin, roleId: roleId.super_admin, grantedBy: U.superAdmin },
    { userId: U.ownerA, roleId: roleId.admin_local, companyId: C.a, grantedBy: U.superAdmin },
    { userId: U.ownerB, roleId: roleId.admin_local, companyId: C.b, grantedBy: U.superAdmin },
    { userId: U.promoterA, roleId: roleId.promoter, companyId: C.a, localId: L.a1, grantedBy: U.ownerA },
    { userId: U.promoterB, roleId: roleId.promoter, companyId: C.b, localId: L.b1, grantedBy: U.ownerB },
    { userId: U.validatorA, roleId: roleId.validator, companyId: C.a, localId: L.a1, grantedBy: U.ownerA },
    { userId: U.validatorB, roleId: roleId.validator, companyId: C.b, localId: L.b1, grantedBy: U.ownerB },
    // Todos los consumidores tienen el rol base 'user'.
    ...[U.sofia, U.mateo, U.valentina, U.lucia, U.carlos, U.daniela].map((id) => ({
      userId: id,
      roleId: roleId.user,
      grantedBy: U.superAdmin,
    })),
  ]);

  // user_preference (1:1)
  const allUserIds = Object.values(U);
  await db.insert(userPreference).values(
    allUserIds.map((id, i) => ({
      userId: id,
      onboardingCompleted: true,
      acceptsMarketing: i % 2 === 0,
      acceptsReminders: true,
      preferredLocale: 'es-PE',
    })),
  );

  // legal_document (terms/privacy/refund_policy). Solo uno current por tipo.
  const LD = { termsOld: uid(), terms: uid(), privacy: uid(), refund: uid() };
  await db.insert(legalDocument).values([
    { id: LD.termsOld, docType: 'terms', version: '0.9', contentUrl: 'https://cdn.urnight.pe/legal/terms-0.9.pdf', isCurrent: false, publishedAt: daysFromNow(-200) },
    { id: LD.terms, docType: 'terms', version: '1.0', contentUrl: 'https://cdn.urnight.pe/legal/terms-1.0.pdf', isCurrent: true, publishedAt: daysFromNow(-60) },
    { id: LD.privacy, docType: 'privacy', version: '1.0', contentUrl: 'https://cdn.urnight.pe/legal/privacy-1.0.pdf', isCurrent: true, publishedAt: daysFromNow(-60) },
    { id: LD.refund, docType: 'refund_policy', version: '1.0', contentUrl: 'https://cdn.urnight.pe/legal/refund-1.0.pdf', isCurrent: true, publishedAt: daysFromNow(-60) },
  ]);

  // legal_acceptance: cada user acepta terms+privacy actuales.
  await db.insert(legalAcceptance).values(
    allUserIds.flatMap((id) => [
      { userId: id, legalDocumentId: LD.terms, versionAccepted: '1.0', ipAddress: '190.232.10.5', acceptedAt: daysFromNow(-30) },
      { userId: id, legalDocumentId: LD.privacy, versionAccepted: '1.0', ipAddress: '190.232.10.5', acceptedAt: daysFromNow(-30) },
    ]),
  );

  // ── 2. Taxonomy & Catalogs ────────────────────────────────────────────────
  console.log('→ Catalogs (zones, types, genres, tags)...');

  const Z = { mira: uid(), barr: uid(), isidro: uid(), surco: uid(), centro: uid(), pueblo: uid() };
  await db.insert(zone).values([
    { id: Z.mira, name: 'Miraflores', slug: 'miraflores', displayOrder: 1 },
    { id: Z.barr, name: 'Barranco', slug: 'barranco', displayOrder: 2 },
    { id: Z.isidro, name: 'San Isidro', slug: 'san-isidro', displayOrder: 3 },
    { id: Z.surco, name: 'Santiago de Surco', slug: 'surco', displayOrder: 4 },
    { id: Z.centro, name: 'Centro de Lima', slug: 'centro-de-lima', displayOrder: 5 },
    { id: Z.pueblo, name: 'Pueblo Libre', slug: 'pueblo-libre', displayOrder: 6, isActive: false },
  ]);

  const LT = { disco: uid(), bar: uid(), lounge: uid(), rooftop: uid(), karaoke: uid() };
  await db.insert(localType).values([
    { id: LT.disco, name: 'Discoteca', slug: 'discoteca', displayOrder: 1 },
    { id: LT.bar, name: 'Bar', slug: 'bar', displayOrder: 2 },
    { id: LT.lounge, name: 'Lounge', slug: 'lounge', displayOrder: 3 },
    { id: LT.rooftop, name: 'Rooftop', slug: 'rooftop', displayOrder: 4 },
    { id: LT.karaoke, name: 'Karaoke', slug: 'karaoke', displayOrder: 5 },
  ]);

  const G = { regg: uid(), elec: uid(), house: uid(), techno: uid(), salsa: uid(), rock: uid(), pop: uid(), hiphop: uid() };
  await db.insert(musicGenre).values([
    { id: G.regg, name: 'Reggaetón', slug: 'reggaeton', displayOrder: 1 },
    { id: G.elec, name: 'Electrónica', slug: 'electronica', displayOrder: 2 },
    { id: G.house, name: 'House', slug: 'house', displayOrder: 3 },
    { id: G.techno, name: 'Techno', slug: 'techno', displayOrder: 4 },
    { id: G.salsa, name: 'Salsa', slug: 'salsa', displayOrder: 5 },
    { id: G.rock, name: 'Rock', slug: 'rock', displayOrder: 6 },
    { id: G.pop, name: 'Pop', slug: 'pop', displayOrder: 7 },
    { id: G.hiphop, name: 'Hip-Hop', slug: 'hip-hop', displayOrder: 8 },
  ]);

  const T = { after: uid(), ladies: uid(), openbar: uid(), livedj: uid(), terraza: uid(), cumple: uid(), preparty: uid(), halloween: uid() };
  await db.insert(tag).values([
    { id: T.after, name: 'After Office', slug: 'after-office', displayOrder: 1 },
    { id: T.ladies, name: 'Ladies Night', slug: 'ladies-night', displayOrder: 2 },
    { id: T.openbar, name: 'Open Bar', slug: 'open-bar', displayOrder: 3 },
    { id: T.livedj, name: 'Live DJ', slug: 'live-dj', displayOrder: 4 },
    { id: T.terraza, name: 'Terraza', slug: 'terraza', displayOrder: 5 },
    { id: T.cumple, name: 'Cumpleaños', slug: 'cumpleanos', displayOrder: 6 },
    { id: T.preparty, name: 'Pre-Party', slug: 'pre-party', displayOrder: 7 },
    { id: T.halloween, name: 'Halloween', slug: 'halloween', displayOrder: 8 },
  ]);

  // ── 3. Companies & Locals ─────────────────────────────────────────────────
  console.log('→ Companies & Locals...');

  await db.insert(company).values([
    { id: C.a, legalName: 'Grupo Nocturno S.A.C.', ruc: '20512345678', commercialName: 'Grupo Nocturno', contactEmail: 'contacto@gruponocturno.pe', contactPhone: '+5114567890', status: 'active' },
    { id: C.b, legalName: 'Lima Beats E.I.R.L.', ruc: '20598765432', commercialName: 'Lima Beats', contactEmail: 'hola@limabeats.pe', contactPhone: '+5114561122', status: 'active' },
    { id: C.c, legalName: 'Andina Entertainment S.A.C.', ruc: '20533344455', commercialName: 'Andina Ent', contactEmail: 'info@andinaent.pe', contactPhone: '+5114569988', status: 'draft' },
  ]);

  const openingHours = {
    mon: null, tue: null,
    wed: '20:00-02:00', thu: '20:00-03:00', fri: '21:00-05:00', sat: '21:00-05:00', sun: '18:00-00:00',
  };

  await db.insert(local).values([
    { id: L.a1, companyId: C.a, zoneId: Z.mira, name: 'Nocturna Club', slug: 'nocturna-club', description: 'La discoteca insignia de Miraflores. Tres ambientes, terraza y la mejor música urbana de Lima.', address: 'Av. José Larco 1234, Miraflores', latitude: -12.1211, longitude: -77.0298, googleMapsUrl: 'https://maps.google.com/?q=-12.1211,-77.0298', openingHours, socials: 'https://instagram.com/nocturnaclub', mainImageKey: 'https://picsum.photos/seed/locals-nocturna-main/1200/800', status: 'active', isVerified: true },
    { id: L.a2, companyId: C.a, zoneId: Z.isidro, name: 'Sky Lounge 360', slug: 'sky-lounge-360', description: 'Rooftop premium con vista panorámica de San Isidro. Coctelería de autor y DJ sets al atardecer.', address: 'Calle Las Begonias 545, San Isidro', latitude: -12.0931, longitude: -77.0227, googleMapsUrl: 'https://maps.google.com/?q=-12.0931,-77.0227', openingHours, socials: 'https://instagram.com/skylounge360', mainImageKey: 'https://picsum.photos/seed/locals-skylounge-main/1200/800', status: 'active', isVerified: true },
    { id: L.b1, companyId: C.b, zoneId: Z.barr, name: 'Barranco Beats', slug: 'barranco-beats', description: 'Templo de la música electrónica en Barranco. Line-ups internacionales y sistema de sonido de élite.', address: 'Jr. Unión 280, Barranco', latitude: -12.1465, longitude: -77.0206, googleMapsUrl: 'https://maps.google.com/?q=-12.1465,-77.0206', openingHours, socials: 'https://instagram.com/barrancobeats', mainImageKey: 'https://picsum.photos/seed/locals-barranco-main/1200/800', status: 'active', isVerified: true },
    { id: L.b2, companyId: C.b, zoneId: Z.surco, name: 'Karaoke Estelar', slug: 'karaoke-estelar', description: 'Salas privadas de karaoke con catálogo de 50k canciones. Ideal para cumpleaños y grupos.', address: 'Av. Caminos del Inca 2510, Surco', latitude: -12.1357, longitude: -76.9931, googleMapsUrl: 'https://maps.google.com/?q=-12.1357,-76.9931', openingHours, socials: 'https://instagram.com/karaokeestelar', mainImageKey: 'https://picsum.photos/seed/locals-estelar-main/1200/800', status: 'active', isVerified: false },
  ]);

  // local_image (main + galería)
  await db.insert(localImage).values([
    { localId: L.a1, storageKey: 'https://picsum.photos/seed/locals-nocturna-main/1200/800', isMain: true, sortOrder: 0, width: 1600, height: 900, sizeBytes: 420000 },
    { localId: L.a1, storageKey: 'https://picsum.photos/seed/locals-nocturna-1/1200/800', isMain: false, sortOrder: 1, width: 1280, height: 720, sizeBytes: 310000 },
    { localId: L.a1, storageKey: 'https://picsum.photos/seed/locals-nocturna-2/1200/800', isMain: false, sortOrder: 2, width: 1280, height: 720, sizeBytes: 298000 },
    { localId: L.a2, storageKey: 'https://picsum.photos/seed/locals-skylounge-main/1200/800', isMain: true, sortOrder: 0, width: 1600, height: 900, sizeBytes: 455000 },
    { localId: L.a2, storageKey: 'https://picsum.photos/seed/locals-skylounge-1/1200/800', isMain: false, sortOrder: 1, width: 1280, height: 720, sizeBytes: 280000 },
    { localId: L.b1, storageKey: 'https://picsum.photos/seed/locals-barranco-main/1200/800', isMain: true, sortOrder: 0, width: 1600, height: 900, sizeBytes: 510000 },
    { localId: L.b2, storageKey: 'https://picsum.photos/seed/locals-estelar-main/1200/800', isMain: true, sortOrder: 0, width: 1600, height: 900, sizeBytes: 390000 },
  ]);

  // local_verification
  await db.insert(localVerification).values([
    { localId: L.a1, status: 'approved', licenseReference: 'LIC-MIRA-2026-0012', documentUrl: 'https://cdn.urnight.pe/verif/a1.pdf', notes: 'Licencia municipal vigente y aforo verificado.', verifiedBy: U.superAdmin, validUntil: '2026-12-31' },
    { localId: L.a2, status: 'approved', licenseReference: 'LIC-ISID-2026-0044', documentUrl: 'https://cdn.urnight.pe/verif/a2.pdf', notes: 'Rooftop con certificado de Defensa Civil.', verifiedBy: U.superAdmin, validUntil: '2026-12-31' },
    { localId: L.b1, status: 'approved', licenseReference: 'LIC-BARR-2026-0099', documentUrl: 'https://cdn.urnight.pe/verif/b1.pdf', notes: 'Aprobado.', verifiedBy: U.superAdmin, validUntil: '2026-12-31' },
    { localId: L.b2, status: 'pending', licenseReference: 'LIC-SURCO-2026-0150', documentUrl: 'https://cdn.urnight.pe/verif/b2.pdf', notes: 'En revisión: falta certificado de aforo.', verifiedBy: null, validUntil: null },
  ]);

  // affiliation_request (pending / approved / rejected)
  await db.insert(affiliationRequest).values([
    { legalName: 'Selva Lounge S.A.C.', ruc: '20544455566', commercialName: 'Selva Lounge', zoneId: Z.barr, address: 'Av. Grau 100, Barranco', socials: 'https://instagram.com/selvalounge', contactName: 'Patricia León', contactEmail: 'patricia@selvalounge.pe', contactPhone: '+51987654321', status: 'pending', submittedBy: U.carlos },
    { legalName: 'Lima Beats E.I.R.L.', ruc: '20598765432', commercialName: 'Lima Beats', zoneId: Z.surco, address: 'Av. Caminos del Inca 2510, Surco', socials: 'https://instagram.com/karaokeestelar', contactName: 'Diego Vargas', contactEmail: 'hola@limabeats.pe', contactPhone: '+5114561122', status: 'approved', submittedBy: U.ownerB, reviewedBy: U.superAdmin, companyId: C.b, localId: L.b2, reviewedAt: daysFromNow(-40) },
    { legalName: 'After Dark Producciones', ruc: '20577788899', commercialName: 'After Dark', zoneId: Z.centro, address: 'Jr. de la Unión 800, Cercado', contactName: 'Gonzalo Ruiz', contactEmail: 'gonzalo@afterdark.pe', contactPhone: '+51933221100', status: 'rejected', rejectionReason: 'RUC con observaciones en SUNAT.', submittedBy: U.daniela, reviewedBy: U.superAdmin, reviewedAt: daysFromNow(-20) },
  ]);

  // Junctions local ↔ catálogos
  await db.insert(localLocalType).values([
    { localId: L.a1, localTypeId: LT.disco },
    { localId: L.a1, localTypeId: LT.bar },
    { localId: L.a2, localTypeId: LT.rooftop },
    { localId: L.a2, localTypeId: LT.lounge },
    { localId: L.b1, localTypeId: LT.disco },
    { localId: L.b2, localTypeId: LT.karaoke },
    { localId: L.b2, localTypeId: LT.bar },
  ]);
  await db.insert(localGenre).values([
    { localId: L.a1, genreId: G.regg },
    { localId: L.a1, genreId: G.pop },
    { localId: L.a1, genreId: G.hiphop },
    { localId: L.a2, genreId: G.house },
    { localId: L.a2, genreId: G.elec },
    { localId: L.b1, genreId: G.techno },
    { localId: L.b1, genreId: G.elec },
    { localId: L.b2, genreId: G.pop },
    { localId: L.b2, genreId: G.salsa },
  ]);
  await db.insert(localTag).values([
    { localId: L.a1, tagId: T.livedj },
    { localId: L.a1, tagId: T.ladies },
    { localId: L.a1, tagId: T.openbar },
    { localId: L.a2, tagId: T.terraza },
    { localId: L.a2, tagId: T.after },
    { localId: L.b1, tagId: T.livedj },
    { localId: L.b2, tagId: T.cumple },
  ]);

  // ── 4. Events & Ticket Types ──────────────────────────────────────────────
  console.log('→ Events & Ticket Types...');

  const E = { e1: uid(), e2: uid(), e3: uid(), e4: uid(), e5: uid(), e6: uid(), e7: uid() };
  const TT = {
    e1g: uid(), e1v: uid(), e1p: uid(),
    e2g: uid(), e2v: uid(),
    e3p: uid(), e3g: uid(),
    e4g: uid(), e4v: uid(),
    e5g: uid(),
    e6g: uid(),
    e7g: uid(),
  };

  // E1 finished (pasado) → tickets used → reviews verificadas
  const e1Date = daysFromNow(-21);
  // upcoming
  const e2Date = daysFromNow(14);
  const e3Date = daysFromNow(7);
  const e4Date = daysFromNow(21);
  const e5Date = daysFromNow(133); // ~Halloween
  const e6Date = daysFromNow(5);
  const e7Date = daysFromNow(10);

  await db.insert(event).values([
    { id: E.e1, localId: L.a1, name: 'Neon Nights vol.5', slug: 'neon-nights-vol-5', description: 'La quinta edición de la fiesta urbana más grande de Miraflores. Sold out histórico.', startsAt: at(e1Date, 22), endsAt: at(daysFromNow(-20), 5), flyerUrl: 'https://picsum.photos/seed/events-neon5-flyer/1200/800', totalCapacity: 270, ticketsSold: 3, checkinsCount: 3, status: 'finished', minAgeNote: '+18', dressCode: 'Urban chic', createdBy: U.ownerA, publishedAt: daysFromNow(-50) },
    { id: E.e2, localId: L.a1, name: 'Reggaetón Old School', slug: 'reggaeton-old-school', description: 'Un viaje a los clásicos del reggaetón 2005-2015. Hosted by DJ Trauma.', startsAt: at(e2Date, 22), endsAt: at(daysFromNow(15), 5), flyerUrl: 'https://picsum.photos/seed/events-oldschool-flyer/1200/800', totalCapacity: 410, ticketsSold: 2, checkinsCount: 0, status: 'published', minAgeNote: '+18', dressCode: 'Casual', createdBy: U.ownerA, publishedAt: daysFromNow(-10) },
    { id: E.e3, localId: L.a2, name: 'Sunset Rooftop Sessions', slug: 'sunset-rooftop-sessions', description: 'House & deep house al atardecer en el rooftop de San Isidro.', startsAt: at(e3Date, 18), endsAt: at(e3Date, 23, 59), flyerUrl: 'https://picsum.photos/seed/events-sunset-flyer/1200/800', totalCapacity: 150, ticketsSold: 2, checkinsCount: 0, status: 'published', minAgeNote: '+18', dressCode: 'Smart casual', createdBy: U.ownerA, publishedAt: daysFromNow(-8) },
    { id: E.e4, localId: L.b1, name: 'Techno Underground', slug: 'techno-underground', description: 'Line-up internacional. 8 horas de techno ininterrumpido.', startsAt: at(e4Date, 23), endsAt: at(daysFromNow(22), 7), flyerUrl: 'https://picsum.photos/seed/events-techno-flyer/1200/800', totalCapacity: 500, ticketsSold: 0, checkinsCount: 0, status: 'published', minAgeNote: '+18', dressCode: 'All black', createdBy: U.ownerB, publishedAt: daysFromNow(-6) },
    { id: E.e5, localId: L.b1, name: 'Halloween Madness', slug: 'halloween-madness', description: 'La fiesta de disfraces más grande del año. Premios al mejor cosplay.', startsAt: at(e5Date, 22), endsAt: at(daysFromNow(134), 6), flyerUrl: 'https://picsum.photos/seed/events-halloween-flyer/1200/800', totalCapacity: 600, ticketsSold: 0, checkinsCount: 0, status: 'scheduled', minAgeNote: '+18', dressCode: 'Disfraz obligatorio', createdBy: U.ownerB, publishedAt: null },
    { id: E.e6, localId: L.b2, name: 'Noche de Karaoke', slug: 'noche-de-karaoke', description: 'Competencia de karaoke con jurado y barra libre de cervezas.', startsAt: at(e6Date, 21), endsAt: at(e6Date, 23, 59), flyerUrl: 'https://picsum.photos/seed/events-karaoke-flyer/1200/800', totalCapacity: 80, ticketsSold: 0, checkinsCount: 0, status: 'published', minAgeNote: '+18', dressCode: 'Libre', createdBy: U.ownerB, publishedAt: daysFromNow(-3) },
    { id: E.e7, localId: L.b1, name: 'Festival Cancelado', slug: 'festival-cancelado', description: 'Evento cancelado por motivos de fuerza mayor.', startsAt: at(e7Date, 22), endsAt: null, flyerUrl: 'https://picsum.photos/seed/events-cancelado-flyer/1200/800', totalCapacity: 300, ticketsSold: 0, checkinsCount: 0, status: 'cancelled', minAgeNote: '+18', dressCode: null, createdBy: U.ownerB, publishedAt: daysFromNow(-12) },
  ]);

  // ticket_type — sold SIEMPRE <= stock (CHECK ck_ticket_type_sold)
  await db.insert(ticketType).values([
    // E1 (finished): general sold 2, vip sold 1
    { id: TT.e1g, eventId: E.e1, name: 'General', tierCode: 'general', price: N(50), stock: 200, sold: 2, maxPerUser: 6, saleStartsAt: daysFromNow(-50), saleEndsAt: daysFromNow(-21), status: 'sold_out' },
    { id: TT.e1v, eventId: E.e1, name: 'VIP', tierCode: 'vip', price: N(120), stock: 50, sold: 1, maxPerUser: 4, saleStartsAt: daysFromNow(-50), saleEndsAt: daysFromNow(-21), status: 'sold_out' },
    { id: TT.e1p, eventId: E.e1, name: 'Premium Box', tierCode: 'premium', price: N(300), stock: 20, sold: 0, maxPerUser: 2, saleStartsAt: daysFromNow(-50), saleEndsAt: daysFromNow(-21), status: 'sold_out' },
    // E2 (published): general sold 1, vip sold 1
    { id: TT.e2g, eventId: E.e2, name: 'General', tierCode: 'general', price: N(50), stock: 300, sold: 1, maxPerUser: 6, saleStartsAt: daysFromNow(-10), saleEndsAt: e2Date, status: 'active' },
    { id: TT.e2v, eventId: E.e2, name: 'VIP', tierCode: 'vip', price: N(120), stock: 80, sold: 1, maxPerUser: 4, saleStartsAt: daysFromNow(-10), saleEndsAt: e2Date, status: 'active' },
    // E3: premium sold 2
    { id: TT.e3p, eventId: E.e3, name: 'Premium', tierCode: 'premium', price: N(180), stock: 50, sold: 2, maxPerUser: 4, saleStartsAt: daysFromNow(-8), saleEndsAt: e3Date, status: 'active' },
    { id: TT.e3g, eventId: E.e3, name: 'General', tierCode: 'general', price: N(80), stock: 100, sold: 0, maxPerUser: 6, saleStartsAt: daysFromNow(-8), saleEndsAt: e3Date, status: 'active' },
    // E4
    { id: TT.e4g, eventId: E.e4, name: 'General', tierCode: 'general', price: N(70), stock: 400, sold: 0, maxPerUser: 6, saleStartsAt: daysFromNow(-6), saleEndsAt: e4Date, status: 'active' },
    { id: TT.e4v, eventId: E.e4, name: 'VIP', tierCode: 'vip', price: N(150), stock: 100, sold: 0, maxPerUser: 4, saleStartsAt: daysFromNow(-6), saleEndsAt: e4Date, status: 'active' },
    // E5 scheduled
    { id: TT.e5g, eventId: E.e5, name: 'Early Bird', tierCode: 'general', price: N(60), stock: 600, sold: 0, maxPerUser: 8, saleStartsAt: daysFromNow(-3), saleEndsAt: e5Date, status: 'active' },
    // E6
    { id: TT.e6g, eventId: E.e6, name: 'Entrada + 1 cerveza', tierCode: 'general', price: N(40), stock: 80, sold: 0, maxPerUser: 10, saleStartsAt: daysFromNow(-3), saleEndsAt: e6Date, status: 'active' },
    // E7 cancelled
    { id: TT.e7g, eventId: E.e7, name: 'General', tierCode: 'general', price: N(90), stock: 300, sold: 0, maxPerUser: 6, status: 'paused' },
  ]);

  // event_image
  await db.insert(eventImage).values([
    { eventId: E.e1, url: 'https://picsum.photos/seed/events-neon5-flyer/1200/800', isFlyer: true, sortOrder: 0 },
    { eventId: E.e1, url: 'https://picsum.photos/seed/events-neon5-1/1200/800', isFlyer: false, sortOrder: 1 },
    { eventId: E.e2, url: 'https://picsum.photos/seed/events-oldschool-flyer/1200/800', isFlyer: true, sortOrder: 0 },
    { eventId: E.e3, url: 'https://picsum.photos/seed/events-sunset-flyer/1200/800', isFlyer: true, sortOrder: 0 },
    { eventId: E.e4, url: 'https://picsum.photos/seed/events-techno-flyer/1200/800', isFlyer: true, sortOrder: 0 },
    { eventId: E.e6, url: 'https://picsum.photos/seed/events-karaoke-flyer/1200/800', isFlyer: true, sortOrder: 0 },
  ]);
  await db.insert(eventGenre).values([
    { eventId: E.e1, genreId: G.regg },
    { eventId: E.e1, genreId: G.hiphop },
    { eventId: E.e2, genreId: G.regg },
    { eventId: E.e3, genreId: G.house },
    { eventId: E.e4, genreId: G.techno },
    { eventId: E.e4, genreId: G.elec },
    { eventId: E.e5, genreId: G.elec },
    { eventId: E.e6, genreId: G.pop },
  ]);
  await db.insert(eventTag).values([
    { eventId: E.e1, tagId: T.livedj },
    { eventId: E.e1, tagId: T.openbar },
    { eventId: E.e2, tagId: T.ladies },
    { eventId: E.e3, tagId: T.terraza },
    { eventId: E.e3, tagId: T.after },
    { eventId: E.e4, tagId: T.livedj },
    { eventId: E.e5, tagId: T.halloween },
    { eventId: E.e6, tagId: T.cumple },
  ]);

  // ── 6. Promoters & Promo Codes (antes de orders por las FK de atribución) ──
  console.log('→ Promoters & Promo Codes...');

  const P = { a: uid(), b: uid() };
  await db.insert(promoter).values([
    { id: P.a, companyId: C.a, localId: L.a1, userId: U.promoterA, name: 'Andrea Flores', contactEmail: 'promoter@urnight.pe', contactPhone: '+51999000004', status: 'active' },
    { id: P.b, companyId: C.b, localId: L.b1, userId: U.promoterB, name: 'Luis Quispe', contactEmail: 'promoter2@urnight.pe', contactPhone: '+51999000010', status: 'active' },
  ]);

  const RL = { a: uid(), b: uid() };
  await db.insert(referralLink).values([
    { id: RL.a, promoterId: P.a, code: 'ANDREA10', url: 'https://urnight.pe/r/ANDREA10', clicks: 154, isActive: true },
    { id: RL.b, promoterId: P.b, code: 'LUISVIP', url: 'https://urnight.pe/r/LUISVIP', clicks: 87, isActive: true },
  ]);

  await db.insert(promoterApplication).values([
    { localId: L.a1, eventId: E.e2, applicantUserId: U.carlos, name: 'Carlos Núñez', contactEmail: 'user5@urnight.pe', contactPhone: '+51999000012', socials: 'https://instagram.com/carlosn', status: 'pending' },
    { localId: L.b1, eventId: E.e4, applicantUserId: U.promoterB, name: 'Luis Quispe', contactEmail: 'promoter2@urnight.pe', contactPhone: '+51999000010', socials: 'https://instagram.com/luisq', status: 'approved', reviewedBy: U.ownerB, createdPromoterId: P.b, reviewedAt: daysFromNow(-35) },
    { localId: L.b2, applicantUserId: U.daniela, name: 'Daniela Ríos', contactEmail: 'user6@urnight.pe', contactPhone: '+51999000013', status: 'rejected', reviewedBy: U.ownerB, reviewedAt: daysFromNow(-15) },
  ]);

  const PC = { welcome: uid(), vip50: uid(), andrea: uid(), summer: uid() };
  await db.insert(promoCode).values([
    { id: PC.welcome, code: 'WELCOME10', discountType: 'percentage', discountValue: N(10), usageQuota: 1000, usedCount: 1, validFrom: daysFromNow(-90), validUntil: daysFromNow(90), scope: 'global', createdBy: U.superAdmin, isActive: true },
    { id: PC.vip50, code: 'VIP50', discountType: 'fixed_amount', discountValue: N(50), usageQuota: 100, usedCount: 0, validFrom: daysFromNow(-10), validUntil: e2Date, scope: 'event', eventId: E.e2, createdBy: U.ownerA, isActive: true },
    { id: PC.andrea, code: 'ANDREA15', discountType: 'percentage', discountValue: N(15), usageQuota: 200, usedCount: 0, validFrom: daysFromNow(-30), validUntil: daysFromNow(60), scope: 'promoter', promoterId: P.a, createdBy: U.ownerA, isActive: true },
    { id: PC.summer, code: 'SUMMER20', discountType: 'percentage', discountValue: N(20), usageQuota: 500, usedCount: 0, validFrom: daysFromNow(-180), validUntil: daysFromNow(-30), scope: 'global', createdBy: U.superAdmin, isActive: false },
  ]);

  // ── 5. Checkout: Orders, Payments, Tickets, Attendees, QR ─────────────────
  console.log('→ Checkout (orders, tickets, attendees, qr)...');

  // Tipo de fila para construir tickets en bloque.
  type TicketSeed = {
    ticketTypeId: string;
    eventId: string;
    status: 'valid' | 'used' | 'cancelled' | 'expired';
    usedAt?: Date | null;
    attendee: { fullName: string; documentType: 'dni' | 'ce' | 'passport'; documentNumber: string; birthDate: string; isBuyer: boolean };
    validatedBy?: string; // si used → genera qr_validation
  };

  // Order helper: inserta order + items + payment + tickets + attendees + qr.
  async function makeOrder(opts: {
    orderCode: string;
    userId: string;
    eventId: string;
    status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
    items: { ticketTypeId: string; quantity: number; unitPrice: number }[];
    discountTotal?: number;
    commissionAmount?: number;
    payment?: { method: 'card' | 'yape' | 'plin'; status: 'pending' | 'approved' | 'rejected'; failureReason?: string };
    tickets?: TicketSeed[];
    createdAt: Date;
    paidAt?: Date | null;
  }) {
    const orderId = uid();
    const subtotal = opts.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    const discount = opts.discountTotal ?? 0;
    const commission = opts.commissionAmount ?? 0;
    const total = subtotal - discount;

    await db.insert(order).values({
      id: orderId,
      orderCode: opts.orderCode,
      userId: opts.userId,
      eventId: opts.eventId,
      subtotal: N(subtotal),
      discountTotal: N(discount),
      commissionAmount: N(commission),
      total: N(total),
      currency: 'PEN',
      status: opts.status,
      createdAt: opts.createdAt,
      paidAt: opts.paidAt ?? (opts.status === 'paid' ? opts.createdAt : null),
    });

    const itemIds: string[] = [];
    await db.insert(orderItem).values(
      opts.items.map((it) => {
        const itemId = uid();
        itemIds.push(itemId);
        return {
          id: itemId,
          orderId,
          ticketTypeId: it.ticketTypeId,
          quantity: it.quantity,
          unitPrice: N(it.unitPrice),
          lineTotal: N(it.unitPrice * it.quantity),
        };
      }),
    );

    if (opts.payment) {
      await db.insert(payment).values({
        orderId,
        gateway: 'mock',
        method: opts.payment.method,
        gatewayReference: `mock_${randomBytes(6).toString('hex')}`,
        amount: N(total),
        status: opts.payment.status,
        failureReason: opts.payment.failureReason ?? null,
        createdAt: opts.createdAt,
        confirmedAt: opts.payment.status === 'approved' ? opts.createdAt : null,
      });
    }

    // tickets: cada TicketSeed se asocia al primer order_item de su ticketType.
    if (opts.tickets?.length) {
      for (const t of opts.tickets) {
        const idx = opts.items.findIndex((it) => it.ticketTypeId === t.ticketTypeId);
        const orderItemId = itemIds[idx >= 0 ? idx : 0];
        const ticketId = uid();
        await db.insert(ticket).values({
          id: ticketId,
          orderItemId,
          eventId: t.eventId,
          ticketTypeId: t.ticketTypeId,
          qrCode: qr(),
          status: t.status,
          pdfUrl: `https://cdn.urnight.pe/tickets/${ticketId}.pdf`,
          issuedAt: opts.createdAt,
          usedAt: t.usedAt ?? null,
        });
        await db.insert(attendee).values({
          ticketId,
          fullName: t.attendee.fullName,
          documentType: t.attendee.documentType,
          documentNumber: t.attendee.documentNumber,
          birthDate: t.attendee.birthDate,
          isBuyer: t.attendee.isBuyer,
        });
        if (t.status === 'used' && t.validatedBy) {
          const ev = [E.e1].includes(t.eventId) ? L.a1 : null;
          await db.insert(qrValidation).values({
            ticketId,
            eventId: t.eventId,
            localId: ev,
            validatedBy: t.validatedBy,
            result: 'valid',
            method: 'scan',
            deviceInfo: 'UrNight Validator / Android 14 / Pixel 7',
            scannedAt: t.usedAt ?? opts.createdAt,
          });
        }
      }
    }

    return orderId;
  }

  // O1 — paid, evento finished E1, 2 generales USADAS (Sofía) → reviews
  await makeOrder({
    orderCode: 'ORD-2026-0001',
    userId: U.sofia,
    eventId: E.e1,
    status: 'paid',
    items: [{ ticketTypeId: TT.e1g, quantity: 2, unitPrice: 50 }],
    payment: { method: 'yape', status: 'approved' },
    createdAt: daysFromNow(-25),
    tickets: [
      { ticketTypeId: TT.e1g, eventId: E.e1, status: 'used', usedAt: at(e1Date, 22, 35), validatedBy: U.validatorA, attendee: { fullName: 'Sofía Castro', documentType: 'dni', documentNumber: '40000006', birthDate: '1998-02-14', isBuyer: true } },
      { ticketTypeId: TT.e1g, eventId: E.e1, status: 'used', usedAt: at(e1Date, 22, 36), validatedBy: U.validatorA, attendee: { fullName: 'Renata Salas', documentType: 'dni', documentNumber: '45111222', birthDate: '1999-04-10', isBuyer: false } },
    ],
  });

  // O2 — paid, E2 (upcoming), VIP + General VÁLIDAS (Mateo), con promo WELCOME10 + atribución a Andrea
  const o2Subtotal = 120 + 50;
  const o2Discount = +(o2Subtotal * 0.1).toFixed(2); // 17.00
  const o2Total = o2Subtotal - o2Discount; // 153.00
  const o2Commission = +(o2Total * 0.1).toFixed(2); // 15.30
  const o2Id = await makeOrder({
    orderCode: 'ORD-2026-0002',
    userId: U.mateo,
    eventId: E.e2,
    status: 'paid',
    items: [
      { ticketTypeId: TT.e2v, quantity: 1, unitPrice: 120 },
      { ticketTypeId: TT.e2g, quantity: 1, unitPrice: 50 },
    ],
    discountTotal: o2Discount,
    commissionAmount: o2Commission,
    payment: { method: 'card', status: 'approved' },
    createdAt: daysFromNow(-4),
    tickets: [
      { ticketTypeId: TT.e2v, eventId: E.e2, status: 'valid', attendee: { fullName: 'Mateo Rojas', documentType: 'dni', documentNumber: '40000007', birthDate: '1999-12-01', isBuyer: true } },
      { ticketTypeId: TT.e2g, eventId: E.e2, status: 'valid', attendee: { fullName: 'Camila Vega', documentType: 'dni', documentNumber: '46333444', birthDate: '2000-09-21', isBuyer: false } },
    ],
  });
  // promo redemption + atribución de O2
  await db.insert(promoCodeRedemption).values({
    promoCodeId: PC.welcome,
    orderId: o2Id,
    userId: U.mateo,
    discountApplied: N(o2Discount),
    redeemedAt: daysFromNow(-4),
  });
  await db.insert(saleAttribution).values({
    orderId: o2Id,
    promoterId: P.a,
    referralLinkId: RL.a,
    commissionRate: RATE(0.1),
    commissionAmount: N(o2Commission),
    status: 'confirmed',
    attributedAt: daysFromNow(-4),
  });

  // O3 — paid, E3, 2 Premium VÁLIDAS (Valentina), pago plin
  await makeOrder({
    orderCode: 'ORD-2026-0003',
    userId: U.valentina,
    eventId: E.e3,
    status: 'paid',
    items: [{ ticketTypeId: TT.e3p, quantity: 2, unitPrice: 180 }],
    payment: { method: 'plin', status: 'approved' },
    createdAt: daysFromNow(-2),
    tickets: [
      { ticketTypeId: TT.e3p, eventId: E.e3, status: 'valid', attendee: { fullName: 'Valentina Díaz', documentType: 'ce', documentNumber: '001234567', birthDate: '2000-06-25', isBuyer: true } },
      { ticketTypeId: TT.e3p, eventId: E.e3, status: 'valid', attendee: { fullName: 'Joaquín Mora', documentType: 'dni', documentNumber: '47555666', birthDate: '1998-11-30', isBuyer: false } },
    ],
  });

  // O4 — pending (Carlos, E4), pago pendiente, SIN tickets emitidos
  await makeOrder({
    orderCode: 'ORD-2026-0004',
    userId: U.carlos,
    eventId: E.e4,
    status: 'pending',
    items: [{ ticketTypeId: TT.e4g, quantity: 1, unitPrice: 70 }],
    payment: { method: 'card', status: 'pending' },
    createdAt: daysFromNow(-1),
  });

  // O5 — cancelled (Daniela, E6), sin tickets
  await makeOrder({
    orderCode: 'ORD-2026-0005',
    userId: U.daniela,
    eventId: E.e6,
    status: 'cancelled',
    items: [{ ticketTypeId: TT.e6g, quantity: 2, unitPrice: 40 }],
    createdAt: daysFromNow(-3),
  });

  // O6 — refunded (Lucía/google, E4 VIP), pago aprobado y luego reembolsado, ticket cancelado
  await makeOrder({
    orderCode: 'ORD-2026-0006',
    userId: U.lucia,
    eventId: E.e4,
    status: 'refunded',
    items: [{ ticketTypeId: TT.e4v, quantity: 1, unitPrice: 150 }],
    payment: { method: 'card', status: 'approved' },
    createdAt: daysFromNow(-5),
    paidAt: daysFromNow(-5),
    tickets: [
      { ticketTypeId: TT.e4v, eventId: E.e4, status: 'cancelled', attendee: { fullName: 'Lucía Paredes', documentType: 'dni', documentNumber: '40000009', birthDate: '1994-08-08', isBuyer: true } },
    ],
  });
  // Nota: O6 refunded → no se contabiliza en ticket_type.sold (E4 sold=0), coherente.

  // O7 — paid, E1, 1 VIP USADA (Mateo segundo comprador) → review verificada
  await makeOrder({
    orderCode: 'ORD-2026-0007',
    userId: U.mateo,
    eventId: E.e1,
    status: 'paid',
    items: [{ ticketTypeId: TT.e1v, quantity: 1, unitPrice: 120 }],
    payment: { method: 'yape', status: 'approved' },
    createdAt: daysFromNow(-26),
    tickets: [
      { ticketTypeId: TT.e1v, eventId: E.e1, status: 'used', usedAt: at(e1Date, 23, 12), validatedBy: U.validatorA, attendee: { fullName: 'Mateo Rojas', documentType: 'dni', documentNumber: '40000007', birthDate: '1999-12-01', isBuyer: true } },
    ],
  });

  // ── 7. Trust: Reviews & Reports ───────────────────────────────────────────
  console.log('→ Trust (reviews, reports)...');

  // Necesitamos ticketIds usados para reviews verificadas.
  const usedTickets = await db
    .select({ id: ticket.id, eventId: ticket.eventId })
    .from(ticket)
    .where(eq(ticket.status, 'used'));
  const sofiaUsed = usedTickets[0];
  const mateoUsed = usedTickets[usedTickets.length - 1];

  await db.insert(review).values([
    // verificadas (target polimórfico: exactamente uno de local/event)
    { userId: U.sofia, targetType: 'event', eventId: E.e1, localId: null, ticketId: sofiaUsed?.id ?? null, rating: 5, comment: '¡La mejor fiesta del año! El sonido y las luces increíbles.', quickTags: ['buen ambiente', 'buena música', 'volveré'], isVerified: true, status: 'published', createdAt: daysFromNow(-19) },
    { userId: U.sofia, targetType: 'local', localId: L.a1, eventId: null, ticketId: sofiaUsed?.id ?? null, rating: 4, comment: 'Local espectacular, aunque la cola para entrar fue larga.', quickTags: ['buena ubicación', 'cola larga'], isVerified: true, status: 'published', createdAt: daysFromNow(-18) },
    { userId: U.mateo, targetType: 'event', eventId: E.e1, localId: null, ticketId: mateoUsed?.id ?? null, rating: 5, comment: 'La zona VIP valió cada sol. Atención de primera.', quickTags: ['vip top', 'buena atención'], isVerified: true, status: 'published', createdAt: daysFromNow(-19) },
    // no verificadas (sin ticket)
    { userId: U.valentina, targetType: 'local', localId: L.b1, eventId: null, ticketId: null, rating: 4, comment: 'Buen sonido pero algo caro el trago.', quickTags: ['buen sonido'], isVerified: false, status: 'published', createdAt: daysFromNow(-10) },
    { userId: U.carlos, targetType: 'local', localId: L.a2, eventId: null, ticketId: null, rating: 5, comment: 'La vista del rooftop es de otro nivel.', quickTags: ['vista increíble', 'terraza'], isVerified: false, status: 'published', createdAt: daysFromNow(-7) },
    // oculta (moderada)
    { userId: U.daniela, targetType: 'event', eventId: E.e6, localId: null, ticketId: null, rating: 1, comment: 'Comentario inapropiado eliminado por moderación.', quickTags: [], isVerified: false, isReported: true, status: 'hidden', createdAt: daysFromNow(-6) },
  ]);

  await db.insert(report).values([
    { reporterUserId: U.daniela, targetType: 'event', eventId: E.e7, localId: null, reason: 'cancelled', comment: 'El evento fue cancelado y no avisaron a tiempo.', severity: 'medium', status: 'open', createdAt: daysFromNow(-9) },
    { reporterUserId: U.carlos, targetType: 'local', localId: L.b2, eventId: null, reason: 'wrong_location', comment: 'La dirección en el mapa no coincide con la real.', severity: 'low', status: 'resolved', resolutionNote: 'Coordenadas corregidas por el equipo de catálogo.', resolvedBy: U.superAdmin, createdAt: daysFromNow(-14), resolvedAt: daysFromNow(-12) },
    { reporterUserId: U.valentina, targetType: 'event', eventId: E.e6, localId: null, reason: 'wrong_price', comment: 'El precio mostrado no incluía el cargo por servicio.', severity: 'low', status: 'reviewed', createdAt: daysFromNow(-4) },
  ]);

  // ── 8. Ops & Platform ─────────────────────────────────────────────────────
  console.log('→ Ops (settings, audit, support, notifications, analytics)...');

  await db.insert(platformSetting).values([
    { key: 'default_commission_rate', value: '0.10', valueType: 'number', updatedBy: U.superAdmin },
    { key: 'currency', value: 'PEN', valueType: 'string', updatedBy: U.superAdmin },
    { key: 'min_age', value: '18', valueType: 'number', updatedBy: U.superAdmin },
    { key: 'checkout_lock_ttl_seconds', value: '30', valueType: 'number', updatedBy: U.superAdmin },
    { key: 'maintenance_mode', value: 'false', valueType: 'boolean', updatedBy: U.superAdmin },
    { key: 'support_email', value: 'soporte@urnight.pe', valueType: 'string', updatedBy: U.superAdmin },
    { key: 'terms_current_version', value: '1.0', valueType: 'string', updatedBy: U.superAdmin },
    { key: 'attribution_window_days', value: '7', valueType: 'number', updatedBy: U.superAdmin },
    { key: 'feature_flags', value: '{"reviews":true,"promoters":true,"push":true}', valueType: 'json', updatedBy: U.superAdmin },
  ]);

  await db.insert(auditLog).values([
    { actorUserId: U.superAdmin, action: 'company.create', entityType: 'company', entityId: C.a, beforeState: null, afterState: { status: 'active', ruc: '20512345678' }, ipAddress: '190.232.10.5', deviceInfo: 'Chrome/Win11', createdAt: daysFromNow(-55) },
    { actorUserId: U.superAdmin, action: 'local.verify', entityType: 'local', entityId: L.a1, beforeState: { isVerified: false }, afterState: { isVerified: true }, ipAddress: '190.232.10.5', deviceInfo: 'Chrome/Win11', createdAt: daysFromNow(-52) },
    { actorUserId: U.ownerA, action: 'event.publish', entityType: 'event', entityId: E.e1, beforeState: { status: 'draft' }, afterState: { status: 'published' }, ipAddress: '200.48.100.3', deviceInfo: 'Safari/macOS', createdAt: daysFromNow(-50) },
    { actorUserId: U.sofia, action: 'order.paid', entityType: 'order', entityId: null, beforeState: { status: 'pending' }, afterState: { status: 'paid', method: 'yape' }, ipAddress: '181.65.20.10', deviceInfo: 'iPhone/iOS', createdAt: daysFromNow(-25) },
    { actorUserId: U.validatorA, action: 'qr.scan', entityType: 'ticket', entityId: sofiaUsed?.id ?? null, beforeState: { status: 'valid' }, afterState: { status: 'used', result: 'valid' }, ipAddress: '10.0.0.5', deviceInfo: 'UrNight Validator/Android', createdAt: at(e1Date, 22, 35) },
    { actorUserId: U.superAdmin, action: 'role.grant', entityType: 'user_role', entityId: null, beforeState: null, afterState: { role: 'admin_local', company: 'Grupo Nocturno' }, ipAddress: '190.232.10.5', deviceInfo: 'Chrome/Win11', createdAt: daysFromNow(-55) },
    { actorUserId: U.ownerA, action: 'promo_code.create', entityType: 'promo_code', entityId: PC.vip50, beforeState: null, afterState: { code: 'VIP50', scope: 'event' }, ipAddress: '200.48.100.3', deviceInfo: 'Safari/macOS', createdAt: daysFromNow(-10) },
  ]);

  await db.insert(supportTicket).values([
    { ticketCode: 'TCK-2026-0001', openedBy: U.ownerA, localId: L.a1, subject: 'Consulta sobre liquidación de comisiones', description: '¿Cuándo se procesa el pago de las comisiones de promotores del último evento?', category: 'request', status: 'open', priority: 'medium' },
    { ticketCode: 'TCK-2026-0002', openedBy: U.sofia, localId: null, subject: 'No me llegó el PDF de mi entrada', description: 'Compré 2 entradas para Neon Nights pero no recibí el correo con el PDF.', category: 'incident', status: 'resolved', priority: 'high', assignedTo: U.superAdmin },
    { ticketCode: 'TCK-2026-0003', openedBy: U.ownerB, localId: L.b1, subject: 'El scanner de QR se cuelga en la puerta', description: 'La app de validación se congela al escanear en modo offline.', category: 'bug', status: 'in_progress', priority: 'high', assignedTo: U.superAdmin },
    { ticketCode: 'TCK-2026-0004', openedBy: U.carlos, localId: null, subject: 'Solicito cambio de titular de entrada', description: 'Quiero transferir mi entrada a otra persona.', category: 'request', status: 'closed', priority: 'low', assignedTo: U.superAdmin },
  ]);

  await db.insert(notification).values([
    { userId: U.sofia, channel: 'email', type: 'order_paid', subject: 'Tu compra fue confirmada — Neon Nights vol.5', body: 'Gracias por tu compra. Adjuntamos tus entradas.', isTransactional: true, status: 'sent', createdAt: daysFromNow(-25), sentAt: daysFromNow(-25) },
    { userId: U.sofia, channel: 'email', type: 'ticket_issued', subject: 'Tus entradas están listas', body: 'Descarga el PDF de tus entradas.', isTransactional: true, status: 'sent', createdAt: daysFromNow(-25), sentAt: daysFromNow(-25) },
    { userId: U.mateo, channel: 'email', type: 'order_paid', subject: 'Tu compra fue confirmada — Reggaetón Old School', body: 'Gracias por tu compra.', isTransactional: true, status: 'sent', createdAt: daysFromNow(-4), sentAt: daysFromNow(-4) },
    { userId: U.mateo, channel: 'push', type: 'event_reminder', subject: 'Tu evento es pronto', body: 'Reggaetón Old School comienza en 24h. ¡Prepárate!', isTransactional: false, status: 'queued', createdAt: daysFromNow(-1) },
    { userId: U.valentina, channel: 'push', type: 'event_reminder', subject: 'Sunset Rooftop Sessions', body: 'Nos vemos este fin de semana en el rooftop.', isTransactional: false, status: 'sent', createdAt: daysFromNow(-1), sentAt: daysFromNow(-1) },
    { userId: U.carlos, channel: 'email', type: 'order_pending', subject: 'Completa tu compra', body: 'Tu orden está pendiente de pago.', isTransactional: true, status: 'failed', failureReason: 'bounce: mailbox full', createdAt: daysFromNow(-1) },
    { userId: U.lucia, channel: 'email', type: 'order_refunded', subject: 'Tu reembolso fue procesado', body: 'Hemos procesado el reembolso de tu orden ORD-2026-0006.', isTransactional: true, status: 'sent', createdAt: daysFromNow(-4), sentAt: daysFromNow(-4) },
  ]);

  await db.insert(analyticsEvent).values([
    { userId: U.sofia, sessionId: 'sess_a1', eventName: 'view_event', eventId: E.e1, localId: L.a1, zoneId: Z.mira, properties: { source: 'home' }, occurredAt: daysFromNow(-26) },
    { userId: U.sofia, sessionId: 'sess_a1', eventName: 'add_to_cart', eventId: E.e1, localId: L.a1, properties: { ticketType: 'general', qty: 2 }, occurredAt: daysFromNow(-25) },
    { userId: U.sofia, sessionId: 'sess_a1', eventName: 'purchase', eventId: E.e1, localId: L.a1, properties: { total: 100, method: 'yape' }, occurredAt: daysFromNow(-25) },
    { userId: U.mateo, sessionId: 'sess_b2', eventName: 'view_event', eventId: E.e2, localId: L.a1, zoneId: Z.mira, properties: { source: 'referral', code: 'ANDREA10' }, occurredAt: daysFromNow(-5) },
    { userId: U.mateo, sessionId: 'sess_b2', eventName: 'checkout_start', eventId: E.e2, properties: { items: 2 }, occurredAt: daysFromNow(-4) },
    { userId: U.valentina, sessionId: 'sess_c3', eventName: 'search', zoneId: Z.isidro, properties: { query: 'rooftop' }, occurredAt: daysFromNow(-3) },
    { userId: null, sessionId: 'sess_anon', eventName: 'view_local', localId: L.b1, zoneId: Z.barr, properties: { source: 'seo' }, occurredAt: daysFromNow(-2) },
  ]);

  await db.insert(pilotFeedback).values([
    { userId: U.sofia, localId: L.a1, source: 'user', area: 'ux', score: 9, comment: 'Comprar fue súper fácil desde el celular.', linkedIssueRef: null },
    { userId: null, localId: L.a1, source: 'local', area: 'door', score: 8, comment: 'El validador agiliza el ingreso, pero falla sin internet.', linkedIssueRef: 'JIRA-UN-142' },
    { userId: U.mateo, localId: null, source: 'user', area: 'payment', score: 6, comment: 'Me gustaría pagar con Yape directo sin redirección.', linkedIssueRef: 'JIRA-UN-150' },
    { userId: U.carlos, localId: L.a2, source: 'user', area: 'other', score: 7, comment: 'Faltan más fotos de los locales.', linkedIssueRef: null },
  ]);

  // ── Resumen ───────────────────────────────────────────────────────────────
  const counts = await sql/* sql */ `
    SELECT
      (SELECT count(*) FROM "user")       AS users,
      (SELECT count(*) FROM "company")    AS companies,
      (SELECT count(*) FROM "local")      AS locals,
      (SELECT count(*) FROM "event")      AS events,
      (SELECT count(*) FROM "ticket_type")AS ticket_types,
      (SELECT count(*) FROM "order")      AS orders,
      (SELECT count(*) FROM "ticket")     AS tickets,
      (SELECT count(*) FROM "review")     AS reviews,
      (SELECT count(*) FROM "promoter")   AS promoters,
      (SELECT count(*) FROM "promo_code") AS promo_codes;
  `;

  console.log('\n✅ Seed completado. Resumen de filas:');
  console.table(counts[0]);

  console.log('\n========================================================');
  console.log('🔑 CREDENCIALES DE PRUEBA (password único para todos)');
  console.log('   Password:  ' + DEMO_PASSWORD);
  console.log('========================================================');
  console.table([
    { rol: 'super_admin', email: 'admin@urnight.pe', nombre: 'Renzo Salcedo', scope: 'plataforma' },
    { rol: 'admin_local', email: 'owner.nocturna@urnight.pe', nombre: 'Carla Mendoza', scope: 'Grupo Nocturno' },
    { rol: 'admin_local', email: 'owner.beats@urnight.pe', nombre: 'Diego Vargas', scope: 'Lima Beats' },
    { rol: 'promoter', email: 'promoter@urnight.pe', nombre: 'Andrea Flores', scope: 'Nocturna Club · ANDREA10' },
    { rol: 'promoter', email: 'promoter2@urnight.pe', nombre: 'Luis Quispe', scope: 'Barranco Beats · LUISVIP' },
    { rol: 'validator', email: 'validator@urnight.pe', nombre: 'José Ramírez', scope: 'Nocturna Club' },
    { rol: 'validator', email: 'validator2@urnight.pe', nombre: 'María Torres', scope: 'Barranco Beats' },
    { rol: 'user', email: 'user@urnight.pe', nombre: 'Sofía Castro', scope: 'consumidor (con compras+reviews)' },
    { rol: 'user', email: 'user2@urnight.pe', nombre: 'Mateo Rojas', scope: 'consumidor (con compras)' },
    { rol: 'user (google)', email: 'lucia.paredes@gmail.com', nombre: 'Lucía Paredes', scope: 'OAuth (sin password)' },
  ]);
  console.log('\nℹ Lucía usa Google OAuth (passwordHash null) → no entra por email/clave.');

  await sql.end({ timeout: 5 });
  console.log('\n→ Conexión cerrada.');
}

main().catch((err) => {
  console.error('\n✖ Seed falló:', err);
  process.exit(1);
});
