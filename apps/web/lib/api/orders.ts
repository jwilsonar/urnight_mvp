import type { CreateOrderDto, OrderResponse, TicketResponse } from '@urnight/contracts';
import { apiFetch } from './client';

/** Respuesta de checkout: la API crea y paga la orden en un paso (MockPayment). */
export interface CheckoutResult {
  order: OrderResponse;
  tickets: TicketResponse[];
}

export function checkout(dto: CreateOrderDto, token: string) {
  return apiFetch<CheckoutResult>('/orders/checkout', { method: 'POST', json: dto, token });
}

export function getOrder(id: string, token: string) {
  return apiFetch<OrderResponse>(`/orders/${id}`, { token });
}
