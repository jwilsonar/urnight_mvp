import type {
  CreateOrderDto,
  CreateTicketHoldDto,
  OrderResponse,
  TicketHoldResponse,
  TicketResponse,
} from '@urnight/contracts';
import { apiFetch } from './client';

/** Respuesta de checkout: la API crea y paga la orden en un paso (MockPayment). */
export interface CheckoutResult {
  order: OrderResponse;
  tickets: TicketResponse[];
}

export function checkout(dto: CreateOrderDto, token: string) {
  return apiFetch<CheckoutResult>('/orders/checkout', { method: 'POST', json: dto, token });
}

export function createTicketHold(
  dto: CreateTicketHoldDto,
  token: string,
) {
  return apiFetch<TicketHoldResponse>('/ticket-holds', {
    method: 'POST',
    json: dto,
    token,
  });
}

export function releaseTicketHold(
  holdId: string,
  token: string,
  keepalive = false,
) {
  return apiFetch<void>(`/ticket-holds/${holdId}`, {
    method: 'DELETE',
    token,
    keepalive,
  });
}

export function getOrder(id: string, token: string) {
  return apiFetch<OrderResponse>(`/orders/${id}`, { token });
}
