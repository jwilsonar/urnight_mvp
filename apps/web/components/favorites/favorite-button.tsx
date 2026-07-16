'use client';

import { Heart } from '@phosphor-icons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import type { FavoriteTargetType } from '@urnight/contracts';
import { Button } from '@urnight/ui';
import { getErrorMessage } from '@/lib/api/error-messages';
import { addFavorite, listFavorites, removeFavorite } from '@/lib/api/favorites';
import { queryKeys } from '@/lib/api/query-keys';

interface FavoriteButtonProps {
  targetType: FavoriteTargetType;
  targetId: string;
  className?: string;
}

/**
 * Botón de favorito reutilizable (local/evento). Comparte una sola query de
 * favoritos (`queryKeys.favorites`) entre todos los botones de la página, así
 * que el estado se deriva del cache — sin prop `initialFavorited`. Oculto para
 * usuarios no autenticados.
 */
export function FavoriteButton({ targetType, targetId, className }: FavoriteButtonProps) {
  const { data: session, status } = useSession();
  const token = session?.accessToken ?? '';
  const queryClient = useQueryClient();

  const { data: favorites, isPending: favoritesLoading } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: () => listFavorites(token),
    enabled: Boolean(token),
  });

  const isFavorited = (favorites ?? []).some(
    (f) => f.targetType === targetType && f.targetId === targetId,
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        await removeFavorite(targetType, targetId, token);
      } else {
        await addFavorite({ targetType, targetId }, token);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      // También al fallar: si la API dice "ya está en favoritos" es que el
      // cache local estaba desfasado (el corazón se veía apagado estando
      // guardado). Refetch para que el corazón refleje la verdad del server.
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
    },
  });

  if (status !== 'authenticated') return null;

  return (
    <Button
      type="button"
      variant={isFavorited ? 'default' : 'outline'}
      size="sm"
      className={className}
      // Mientras la lista no cargó, `isFavorited` aún no es confiable: mejor
      // esperar que dejar togglear sobre un estado que puede estar al revés.
      disabled={mutation.isPending || favoritesLoading}
      onClick={() => mutation.mutate()}
      aria-pressed={isFavorited}
    >
      <Heart weight={isFavorited ? 'fill' : 'regular'} className="size-4" />
      {isFavorited ? 'En favoritos' : 'Favorito'}
    </Button>
  );
}
