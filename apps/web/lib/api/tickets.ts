import type { TicketResponse } from '@urnight/contracts';
import { apiFetch } from './client';

/** Billetera de entradas del usuario autenticado. */
export function getMyTickets(token: string) {
  return apiFetch<TicketResponse[]>('/tickets/me', { token });
}
