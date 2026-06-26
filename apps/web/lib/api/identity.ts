import type { PreferenceResponse, UpdatePreferenceDto } from '@urnight/contracts';
import { apiFetch } from './client';

/** Onboarding y preferencias del usuario autenticado (dominio Identity, /me). */

/** Marca el onboarding como completado (POST /me/onboarding). */
export function completeOnboarding(token: string): Promise<PreferenceResponse> {
  return apiFetch<PreferenceResponse>('/me/onboarding', { method: 'POST', token });
}

/** Actualiza preferencias del usuario (PATCH /me/preferences). */
export function updatePreferences(dto: UpdatePreferenceDto, token: string): Promise<PreferenceResponse> {
  return apiFetch<PreferenceResponse>('/me/preferences', { method: 'PATCH', json: dto, token });
}
