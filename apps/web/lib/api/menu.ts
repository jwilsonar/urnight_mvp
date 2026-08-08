import type {
  LocalOrderWindowResponse,
  MenuCategoryListResponse,
  MenuProductListResponse,
  MenuProductResponse,
} from "@urnight/contracts";
import { apiFetch } from "./client";

/** Lecturas públicas de la carta de un local. */
export function getMenuCategories(localId: string, signal?: AbortSignal) {
  return apiFetch<MenuCategoryListResponse>(
    `/locals/${localId}/menu/categories`,
    { signal },
  );
}

export function getMenuProducts(localId: string, signal?: AbortSignal) {
  return apiFetch<MenuProductListResponse>(`/locals/${localId}/menu/products`, {
    signal,
  });
}

export function getMenuProduct(
  localId: string,
  productId: string,
  signal?: AbortSignal,
) {
  return apiFetch<MenuProductResponse>(
    `/locals/${localId}/menu/products/${productId}`,
    { signal },
  );
}

export function getLocalOrderWindows(localId: string, signal?: AbortSignal) {
  return apiFetch<LocalOrderWindowResponse[]>(
    `/locals/${localId}/menu/order-windows`,
    { signal },
  );
}
