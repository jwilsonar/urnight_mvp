import type {
  CreateLocalOrderDto,
  LocalOrderResponse,
  PayLocalOrderDto,
} from "@urnight/contracts";
import { apiFetch } from "./client";

/** Pedidos del asistente autenticado dentro del local. */
export function createLocalOrder(
  localId: string,
  dto: CreateLocalOrderDto,
  token: string,
) {
  return apiFetch<LocalOrderResponse>(`/locals/${localId}/orders`, {
    method: "POST",
    json: dto,
    token,
  });
}

export function getMyLocalOrder(
  orderId: string,
  token: string,
  signal?: AbortSignal,
) {
  return apiFetch<LocalOrderResponse>(`/local-orders/${orderId}`, {
    token,
    signal,
  });
}

export function payLocalOrder(
  orderId: string,
  dto: PayLocalOrderDto,
  token: string,
) {
  return apiFetch<LocalOrderResponse>(`/local-orders/${orderId}/pay`, {
    method: "POST",
    json: dto,
    token,
  });
}
