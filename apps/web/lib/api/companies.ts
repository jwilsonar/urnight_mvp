import type {
  AffiliationResponse,
  CompanyResponse,
  ReviewAffiliationDto,
  SubmitAffiliationDto,
  UpdateCompanyDto,
} from '@urnight/contracts';
import { apiFetch } from './client';

/** Cliente del dominio Empresas (COMPANY). */

/** Envía una solicitud pública de afiliación (POST /affiliation-requests). */
export function submitAffiliation(dto: SubmitAffiliationDto) {
  return apiFetch<AffiliationResponse>('/affiliation-requests', { method: 'POST', json: dto });
}

/** Revisa una solicitud de afiliación por ID (POST /affiliation-requests/:id/review). super_admin. */
export function reviewAffiliation(id: string, dto: ReviewAffiliationDto, token?: string) {
  return apiFetch<AffiliationResponse>(`/affiliation-requests/${id}/review`, {
    method: 'POST',
    json: dto,
    token,
  });
}

/** Todas las empresas (GET /companies, #16). super_admin. */
export function listCompanies(token?: string) {
  return apiFetch<CompanyResponse[]>('/companies', { token });
}

/** Empresa del actor (GET /companies/me, #2/#29). admin_local. */
export function getMyCompany(token?: string) {
  return apiFetch<CompanyResponse>('/companies/me', { token });
}

/** Actualiza el perfil de la propia empresa (PUT /companies/me, #29). */
export function updateMyCompany(dto: UpdateCompanyDto, token?: string) {
  return apiFetch<CompanyResponse>('/companies/me', { method: 'PUT', json: dto, token });
}

/** Suspende una empresa (POST /companies/:id/suspend, #16). super_admin. */
export function suspendCompany(id: string, token?: string) {
  return apiFetch<CompanyResponse>(`/companies/${id}/suspend`, { method: 'POST', token });
}

/** Activa una empresa (POST /companies/:id/activate, #16). super_admin. */
export function activateCompany(id: string, token?: string) {
  return apiFetch<CompanyResponse>(`/companies/${id}/activate`, { method: 'POST', token });
}
