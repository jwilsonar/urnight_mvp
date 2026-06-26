import type {
  ConfirmLocalImageDto,
  LocalImageListResponse,
  LocalImageResponse,
  ReorderLocalImagesDto,
} from '@urnight/contracts';
import { apiFetch } from './client';

/** Galería de un local (pública). */
export function listLocalImages(token: string, localId: string) {
  return apiFetch<LocalImageListResponse>(`/locals/${localId}/images`, { token });
}

/** Confirma una imagen subida a staging y la persiste en la galería. */
export function confirmLocalImage(localId: string, dto: ConfirmLocalImageDto, token: string) {
  return apiFetch<LocalImageResponse>(`/locals/${localId}/images`, {
    method: 'POST',
    json: dto,
    token,
  });
}

/** Marca una imagen como portada del local. */
export function setMainLocalImage(localId: string, imageId: string, token: string) {
  return apiFetch<LocalImageResponse>(`/locals/${localId}/images/${imageId}/main`, {
    method: 'PATCH',
    token,
  });
}

/** Reordena la galería (orderedIds = nuevo orden). */
export function reorderLocalImages(localId: string, dto: ReorderLocalImagesDto, token: string) {
  return apiFetch<LocalImageListResponse>(`/locals/${localId}/images/reorder`, {
    method: 'PATCH',
    json: dto,
    token,
  });
}

/** Elimina una imagen (objeto S3 + fila). */
export function deleteLocalImage(localId: string, imageId: string, token: string) {
  return apiFetch<void>(`/locals/${localId}/images/${imageId}`, { method: 'DELETE', token });
}
