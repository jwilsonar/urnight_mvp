import type {
  ApplyPromoterDto,
  AssignEventDto,
  AssignmentResponse,
  CreatePromoCodeDto,
  CreatePromoterDto,
  GenerateRedemptionCodeDto,
  PromoCodeResponse,
  PromoRedemptionResponse,
  PromoterApplicationResponse,
  PromoterAssociationResponse,
  RedemptionCodeResponse,
  PromoterResponse,
  PromoterSalesResponse,
  PromoValidationResponse,
  ResolveRedemptionCodeResponse,
  ValidatePromoCodeDto,
} from '@urnight/contracts';
import { apiFetch } from './client';

/**
 * Cliente del módulo Promotores. Cubre promotores, postulaciones, códigos
 * promocionales y comisiones. Cada función acepta el access token (de la sesión
 * en Server Components o de `useSession()` en cliente).
 *
 * Nota de backend: no existe `GET /promoters/me`, por lo que el dashboard
 * gestiona el `promoterId` en estado tras crear el promotor.
 */

/**
 * Invita a un promotor (POST /promoters). Crea el promotor en estado `pending`;
 * la persona invitada debe confirmar la asociación desde su cuenta. El companyId
 * lo deriva el backend del actor (no se envía).
 */
export function createPromoter(dto: CreatePromoterDto, token?: string) {
  return apiFetch<PromoterResponse>('/promoters', { method: 'POST', json: dto, token });
}

/**
 * Promotores de MI empresa (GET /promoters/mine). Aislado por tenant en el
 * backend — nunca devuelve promotores de otra empresa.
 */
export function listMyPromoters(token?: string) {
  return apiFetch<PromoterResponse[]>('/promoters/mine', { token });
}

/** Invitaciones de asociación pendientes dirigidas al usuario (GET /promoters/me/associations). */
export function listMyPromoterAssociations(token?: string) {
  return apiFetch<PromoterAssociationResponse[]>('/promoters/me/associations', { token });
}

/** Confirma una asociación pendiente (POST /promoters/:id/confirm). Activa + link + rol. */
export function confirmPromoterAssociation(promoterId: string, token?: string) {
  return apiFetch<PromoterResponse>(`/promoters/${promoterId}/confirm`, { method: 'POST', token });
}

/** Rechaza una asociación pendiente (POST /promoters/:id/reject). */
export function rejectPromoterAssociation(promoterId: string, token?: string) {
  return apiFetch<PromoterAssociationResponse>(`/promoters/${promoterId}/reject`, {
    method: 'POST',
    token,
  });
}

/** Comisiones y atribuciones de un promotor (GET /promoters/:id/sales). */
export function getPromoterSales(promoterId: string, token?: string) {
  return apiFetch<PromoterSalesResponse>(`/promoters/${promoterId}/sales`, { token });
}

/** Registra un clic en un link de referido (POST /promoters/referrals/:code/click). Público. */
export function registerReferralClick(code: string) {
  return apiFetch<void>(`/promoters/referrals/${encodeURIComponent(code)}/click`, {
    method: 'POST',
  });
}

/** Postula para ser promotor (POST /promoter-applications). Público. */
export function applyPromoter(dto: ApplyPromoterDto, token?: string) {
  return apiFetch<PromoterApplicationResponse>('/promoter-applications', {
    method: 'POST',
    json: dto,
    token,
  });
}

/** Crea un código promocional (POST /promo-codes). */
export function createPromoCode(dto: CreatePromoCodeDto, token?: string) {
  return apiFetch<PromoCodeResponse>('/promo-codes', { method: 'POST', json: dto, token });
}

/** Valida un código contra un subtotal y devuelve el descuento (POST /promo-codes/validate). Público. */
export function validatePromoCode(dto: ValidatePromoCodeDto, token?: string) {
  return apiFetch<PromoValidationResponse>('/promo-codes/validate', {
    method: 'POST',
    json: dto,
    token,
  });
}

/** Canjes de promo del usuario autenticado (GET /me/redemptions, #13). */
export function listMyRedemptions(token: string) {
  return apiFetch<PromoRedemptionResponse[]>('/me/redemptions', { token });
}

/** Canjes de un código promocional (GET /promo-codes/:id/redemptions, admin #13). */
export function listPromoCodeRedemptions(promoCodeId: string, token?: string) {
  return apiFetch<PromoRedemptionResponse[]>(`/promo-codes/${promoCodeId}/redemptions`, { token });
}

/** Promotor ACTIVO ligado a mi usuario, o `null` si no soy promotor (GET /promoters/me). */
export function getMyPromoter(token?: string) {
  return apiFetch<PromoterResponse | null>('/promoters/me', { token });
}

/** Asigna un evento (descuento + cupo por tipo) a un promotor (POST /promoters/:id/assignments). */
export function assignEventToPromoter(promoterId: string, dto: AssignEventDto, token?: string) {
  return apiFetch<AssignmentResponse>(`/promoters/${promoterId}/assignments`, {
    method: 'POST',
    json: dto,
    token,
  });
}

/** Asignaciones de un promotor de mi empresa (GET /promoters/:id/assignments, admin). */
export function listPromoterAssignments(promoterId: string, token?: string) {
  return apiFetch<AssignmentResponse[]>(`/promoters/${promoterId}/assignments`, { token });
}

/** Desasigna un evento de un promotor (DELETE /promoters/:id/assignments/:promoterEventId). */
export function unassignEvent(promoterId: string, promoterEventId: string, token?: string) {
  return apiFetch<void>(`/promoters/${promoterId}/assignments/${promoterEventId}`, {
    method: 'DELETE',
    token,
  });
}

/** Eventos que me asignaron a promocionar (GET /promoters/me/assignments, promotor). */
export function listMyAssignments(token?: string) {
  return apiFetch<AssignmentResponse[]>('/promoters/me/assignments', { token });
}

/** Genera un código de canje single-use para un tipo de entrada (POST /promoters/me/redemption-codes). */
export function generateRedemptionCode(dto: GenerateRedemptionCodeDto, token?: string) {
  return apiFetch<RedemptionCodeResponse>('/promoters/me/redemption-codes', {
    method: 'POST',
    json: dto,
    token,
  });
}

/** Códigos de canje de una asignación mía (GET /promoters/me/redemption-codes?promoterEventId=). */
export function listMyRedemptionCodes(promoterEventId: string, token?: string) {
  return apiFetch<RedemptionCodeResponse[]>('/promoters/me/redemption-codes', {
    token,
    query: { promoterEventId },
  });
}

/** Resuelve un código de canje para la landing/checkout (GET /redemption-codes/resolve/:code). Público. */
export function resolveRedemptionCode(code: string) {
  return apiFetch<ResolveRedemptionCodeResponse>(
    `/redemption-codes/resolve/${encodeURIComponent(code)}`,
    {},
  );
}

/** Registra un clic del enlace corto /p/<code> (POST /redemption-codes/:code/click). Público. */
export function registerRedemptionClick(code: string) {
  return apiFetch<void>(`/redemption-codes/${encodeURIComponent(code)}/click`, { method: 'POST' });
}
