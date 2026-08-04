"use client";

import type { QueryClient } from "@tanstack/react-query";
import { signOutAction } from "@/lib/auth-actions";

/** Cancela trabajo en vuelo y elimina datos privados del usuario anterior. */
export async function clearClientQueryCache(
  queryClient: QueryClient,
): Promise<void> {
  try {
    await queryClient.cancelQueries();
  } catch {
    /* El cierre de sesión no debe quedar bloqueado por una cancelación fallida. */
  } finally {
    queryClient.clear();
  }
}

/** Limpia la caché cliente antes de ejecutar el cierre server-side. */
export async function clearCacheAndSignOut(
  queryClient: QueryClient,
): Promise<void> {
  await clearClientQueryCache(queryClient);
  await signOutAction();
}
