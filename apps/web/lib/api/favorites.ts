import type { AddFavoriteDto, FavoriteResponse, FavoriteTargetType } from '@urnight/contracts';
import { apiFetch } from './client';

/** Favoritos del usuario autenticado (dominio Identity, /me/favorites, §4.3). */

/** Lista los favoritos del usuario (GET /me/favorites). */
export function listFavorites(token: string): Promise<FavoriteResponse[]> {
  return apiFetch<FavoriteResponse[]>('/me/favorites', { token });
}

/** Marca un local/evento como favorito (POST /me/favorites). */
export function addFavorite(dto: AddFavoriteDto, token: string): Promise<FavoriteResponse> {
  return apiFetch<FavoriteResponse>('/me/favorites', { method: 'POST', json: dto, token });
}

/** Quita un favorito (DELETE /me/favorites/:targetType/:targetId). */
export function removeFavorite(
  targetType: FavoriteTargetType,
  targetId: string,
  token: string,
): Promise<void> {
  return apiFetch<void>(`/me/favorites/${targetType}/${targetId}`, { method: 'DELETE', token });
}
