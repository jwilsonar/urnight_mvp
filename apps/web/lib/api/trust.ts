import type { CreateReportDto, CreateReviewDto, ReportResponse, ReviewResponse } from '@urnight/contracts';
import { apiFetch } from './client';

/** Reseñas (lectura pública) y reportes (requieren sesión) — dominio Trust. */

export function getReviews(params: { localId?: string; eventId?: string }) {
  return apiFetch<ReviewResponse[]>('/reviews', { query: params, next: { revalidate: 30 } });
}

export function createReview(dto: CreateReviewDto, token: string) {
  return apiFetch<ReviewResponse>('/reviews', { method: 'POST', json: dto, token });
}

export function createReport(dto: CreateReportDto, token: string) {
  return apiFetch<ReportResponse>('/reports', { method: 'POST', json: dto, token });
}
