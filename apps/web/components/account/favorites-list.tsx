"use client";

import { CalendarBlank, Heart, MapPin } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import type { FavoriteResponse, FavoriteTargetType } from "@urnight/contracts";
import { Badge, Button, Card } from "@urnight/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { listFavorites } from "@/lib/api/favorites";
import { queryKeys } from "@/lib/api/query-keys";
import { StorageImage } from "@/lib/storage/storage-context";

/**
 * Lista los favoritos del usuario en /account/guardados, enriquecidos con el
 * nombre/portada/fecha del local o evento y enlazados a su ficha. El backend
 * (GET /me/favorites) resuelve el target cross-módulo y limpia perezosamente los
 * eventos cancelados o ya pasados, así que aquí solo se renderiza.
 *
 * @param filter Si se pasa, restringe a un tipo (local/evento) — usado en la
 * vista de Guardados con pestañas.
 */
export function FavoritesList({
  filter,
}: { filter?: FavoriteTargetType } = {}) {
  const t = useTranslations("account.favoritesList");
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: () => listFavorites(token),
    enabled: Boolean(token),
  });

  const favorites = filter
    ? data?.filter((f) => f.targetType === filter)
    : data;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }
  // Distingue error de vacío (M9): un fallo del API no es "aún no tienes favoritos".
  if (isError) {
    return (
      <ErrorState
        title={t("error.title")}
        description={t("error.description")}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!favorites || favorites.length === 0) {
    const localsOnly = filter === "local";
    return (
      <EmptyState
        icon={<Heart weight="duotone" />}
        title={localsOnly ? t("empty.venuesTitle") : t("empty.title")}
        description={t("empty.description")}
        action={
          <Button asChild>
            <Link href={localsOnly ? "/locals" : "/events"}>
              {localsOnly ? t("empty.venuesAction") : t("empty.eventsAction")}
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {favorites.map((favorite) => (
        <li key={favorite.id}>
          <FavoriteCard favorite={favorite} />
        </li>
      ))}
    </ul>
  );
}

function FavoriteCard({ favorite }: { favorite: FavoriteResponse }) {
  const t = useTranslations("account.favoritesList");
  const format = useFormatter();
  const isLocal = favorite.targetType === "local";
  const { target } = favorite;
  const Icon = isLocal ? MapPin : CalendarBlank;
  const savedAt = t("savedOn", {
    date: format.dateTime(new Date(favorite.createdAt), { dateStyle: "long" }),
  });
  const subtitle =
    !isLocal && target?.startsAt
      ? format.dateTime(new Date(target.startsAt), {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : savedAt;

  const card = (
    <Card className="flex h-full items-center gap-3 overflow-hidden p-0 transition-colors hover:border-primary">
      <div className="relative h-16 w-16 shrink-0 bg-muted">
        {target?.imageUrl ? (
          <StorageImage
            src={target.imageUrl}
            alt={target.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Icon className="h-6 w-6" weight="duotone" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-2 pr-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{isLocal ? t("venue") : t("event")}</Badge>
          <Heart weight="fill" className="size-4 text-primary" />
        </div>
        <h3 className="mt-1 line-clamp-1 font-heading text-sm font-semibold leading-tight">
          {target?.name ?? (isLocal ? t("venue") : t("event"))}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </Card>
  );

  // Sin target resuelto (huérfano): tarjeta sin enlace.
  if (!target) return card;

  return (
    <Link
      href={`/${isLocal ? "locals" : "events"}/${target.slug}`}
      className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {card}
    </Link>
  );
}
