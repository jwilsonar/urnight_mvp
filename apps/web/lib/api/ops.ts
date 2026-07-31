import type {
  AuditLogResponse,
  CreateSupportTicketDto,
  LegalDocType,
  LegalDocumentResponse,
  LocalVerificationDocumentResponse,
  NotificationResponse,
  PlatformSettingResponse,
  PublishLegalDocumentDto,
  ResolveSupportTicketDto,
  ReviewVerificationDto,
  ReviewLocalVerificationDocumentDto,
  SupportTicketResponse,
  UpsertPlatformSettingDto,
  VerificationResponse,
} from '@urnight/contracts';
import { apiFetch } from './client';

/**
 * Cliente del módulo Operaciones (super_admin). Cubre ajustes de plataforma,
 * soporte interno, notificaciones, documentos legales y revisión de
 * verificaciones de local. Cada función acepta el access token (de la sesión en
 * Server Components o de `useSession()` en cliente).
 *
 * Notas de backend (gaps cubiertos en la UI):
 * - No existe endpoint de listado de ajustes ni de tickets de soporte: la UI es
 *   orientada a clave/ID (formularios) en lugar de tablas.
 * - `GET /legal-documents/current` devuelve UN documento por `docType`, no una
 *   lista: consultamos cada tipo por separado.
 * - `POST /support-tickets` exige rol `admin_local` (no super_admin); el alta se
 *   ofrece de forma informativa y puede devolver 403 para un super_admin puro.
 */

/* ---------------------------------------------------------------- Ajustes -- */

/** Lee un ajuste de plataforma por clave (GET /platform-settings/:key). Público. */
export function getPlatformSetting(key: string, token?: string) {
  return apiFetch<PlatformSettingResponse>(`/platform-settings/${encodeURIComponent(key)}`, {
    token,
  });
}

/** Crea o actualiza un ajuste de plataforma (PUT /platform-settings). super_admin. */
export function upsertPlatformSetting(dto: UpsertPlatformSettingDto, token?: string) {
  return apiFetch<PlatformSettingResponse>('/platform-settings', {
    method: 'PUT',
    json: dto,
    token,
  });
}

/* --------------------------------------------------------------- Soporte -- */

/** Abre un ticket de soporte interno (POST /support-tickets). Requiere admin_local. */
export function createSupportTicket(dto: CreateSupportTicketDto, token?: string) {
  return apiFetch<SupportTicketResponse>('/support-tickets', {
    method: 'POST',
    json: dto,
    token,
  });
}

/** Actualiza el estado de un ticket (POST /support-tickets/:id/status). super_admin. */
export function resolveSupportTicket(id: string, dto: ResolveSupportTicketDto, token?: string) {
  return apiFetch<SupportTicketResponse>(`/support-tickets/${id}/status`, {
    method: 'POST',
    json: dto,
    token,
  });
}

/* ---------------------------------------------------------- Notificaciones -- */

/** Notificaciones del usuario actual (GET /notifications/me). */
export function getMyNotifications(token?: string) {
  return apiFetch<NotificationResponse[]>('/notifications/me', { token });
}

/* --------------------------------------------------------------- Auditoría -- */

/** Últimos registros de auditoría (GET /audit-logs, #23). super_admin. */
export function listAuditLogs(token?: string) {
  return apiFetch<AuditLogResponse[]>('/audit-logs', { query: { limit: 200 }, token });
}

/* ----------------------------------------------------------------- Legal -- */

/**
 * Documento legal vigente para un tipo (GET /legal-documents/current?docType=). Público.
 * `revalidate` habilita ISR de Next (la página legal pública lo cachea por horas).
 */
export function getCurrentLegalDocument(
  docType: LegalDocType,
  token?: string,
  opts?: { revalidate?: number | false },
) {
  return apiFetch<LegalDocumentResponse>('/legal-documents/current', {
    query: { docType },
    token,
    ...(opts?.revalidate !== undefined ? { next: { revalidate: opts.revalidate } } : {}),
  });
}

/** Publica una nueva versión de documento legal (POST /legal-documents). super_admin. */
export function publishLegalDocument(dto: PublishLegalDocumentDto, token?: string) {
  return apiFetch<LegalDocumentResponse>('/legal-documents', {
    method: 'POST',
    json: dto,
    token,
  });
}

/* ----------------------------------------------------------- Revisiones -- */

/** Revisa (aprueba/observa/expira) una verificación de local
 *  (POST /local-verifications/:id/review). super_admin. */
export function reviewLocalVerification(id: string, dto: ReviewVerificationDto, token?: string) {
  return apiFetch<VerificationResponse>(`/local-verifications/${id}/review`, {
    method: 'POST',
    json: dto,
    token,
  });
}

export function listPendingLocalVerificationDocuments(token?: string) {
  return apiFetch<LocalVerificationDocumentResponse[]>(
    '/local-verification-documents/pending',
    { token },
  );
}

export function reviewLocalVerificationDocument(
  id: string,
  dto: ReviewLocalVerificationDocumentDto,
  token?: string,
) {
  return apiFetch<LocalVerificationDocumentResponse>(
    `/local-verification-documents/${id}/review`,
    { method: 'POST', json: dto, token },
  );
}
