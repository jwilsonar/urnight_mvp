"use client";

import { Heart } from "@phosphor-icons/react";
import { m } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { FavoriteTargetType } from "@urnight/contracts";
import { Button } from "@urnight/ui";
import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from "@/lib/api/favorites";
import { queryKeys } from "@/lib/api/query-keys";

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
export function FavoriteButton({
  targetType,
  targetId,
  className,
}: FavoriteButtonProps) {
  const t = useTranslations("common.favorites");
  const { data: session, status } = useSession();
  const token = session?.accessToken ?? "";
  const queryClient = useQueryClient();
  const [optimisticFavorited, setOptimisticFavorited] = useState<
    boolean | null
  >(null);

  const { data: favorites, isPending: favoritesLoading } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: () => listFavorites(token),
    enabled: Boolean(token),
  });

  const serverFavorited = (favorites ?? []).some(
    (f) => f.targetType === targetType && f.targetId === targetId,
  );
  const isFavorited = optimisticFavorited ?? serverFavorited;

  useEffect(() => {
    setOptimisticFavorited(null);
  }, [targetId, targetType]);

  const mutation = useMutation({
    mutationFn: async (nextFavorited: boolean) => {
      if (!nextFavorited) {
        await removeFavorite(targetType, targetId, token);
      } else {
        await addFavorite({ targetType, targetId }, token);
      }
    },
    onMutate: (nextFavorited) => {
      setOptimisticFavorited(nextFavorited);
    },
    onSuccess: async (_data, nextFavorited) => {
      toast.success(nextFavorited ? t("added") : t("removed"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
      setOptimisticFavorited(null);
    },
    onError: () => {
      setOptimisticFavorited(null);
      toast.error(t("error"));
      // También al fallar: si la API dice "ya está en favoritos" es que el
      // cache local estaba desfasado (el corazón se veía apagado estando
      // guardado). Refetch para que el corazón refleje la verdad del server.
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
    },
  });

  if (status !== "authenticated") return null;

  return (
    <Button
      type="button"
      variant={isFavorited ? "default" : "outline"}
      size="sm"
      className={`text-foreground ${className ?? ""}`}
      // Mientras la lista no cargó, `isFavorited` aún no es confiable: mejor
      // esperar que dejar togglear sobre un estado que puede estar al revés.
      disabled={mutation.isPending || favoritesLoading}
      onClick={() => mutation.mutate(!isFavorited)}
      aria-pressed={isFavorited}
    >
      <m.span
        key={isFavorited ? "favorited" : "not-favorited"}
        initial={{ scale: 0.75 }}
        animate={{ scale: isFavorited ? [0.75, 1.2, 1] : 1 }}
        transition={{ duration: 0.3 }}
        aria-hidden
      >
        <Heart weight={isFavorited ? "fill" : "regular"} className="size-4" />
      </m.span>
      {isFavorited ? t("saved") : t("save")}
    </Button>
  );
}
