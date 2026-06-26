import type {
  AuthTokensResponse,
  RegisterDto,
  UserProfileResponse,
} from '@urnight/contracts';
import { apiFetch } from '../client';

/**
 * Llamadas crudas al dominio de identidad. Se usan del lado servidor dentro de
 * la config de NextAuth y de los Server Actions de auth (los tokens nunca se
 * exponen al cliente).
 */

export function loginRequest(input: { email: string; password: string }): Promise<AuthTokensResponse> {
  return apiFetch<AuthTokensResponse>('/auth/login', { method: 'POST', json: input });
}

export function registerRequest(input: RegisterDto): Promise<AuthTokensResponse> {
  return apiFetch<AuthTokensResponse>('/auth/register', { method: 'POST', json: input });
}

export function googleExchange(idToken: string): Promise<AuthTokensResponse> {
  return apiFetch<AuthTokensResponse>('/auth/google', { method: 'POST', json: { idToken } });
}

export function refreshTokens(refreshToken: string): Promise<AuthTokensResponse> {
  return apiFetch<AuthTokensResponse>('/auth/refresh', { method: 'POST', json: { refreshToken } });
}

export function fetchMe(token: string): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>('/auth/me', { token });
}

export function verifyEmailRequest(token: string): Promise<{ emailVerified: boolean }> {
  return apiFetch<{ emailVerified: boolean }>('/auth/verify-email', { method: 'POST', json: { token } });
}
