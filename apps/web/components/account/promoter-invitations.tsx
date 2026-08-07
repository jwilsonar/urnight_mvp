"use client";

import { Buildings, Check, X } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { PromoterAssociationResponse } from "@urnight/contracts";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@urnight/ui";
import {
  confirmPromoterAssociation,
  listMyPromoterAssociations,
  rejectPromoterAssociation,
} from "@/lib/api/promoters";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

function InvitationCard({
  invitation,
  token,
}: {
  invitation: PromoterAssociationResponse;
  token: string;
}) {
  const t = useTranslations("account.invitations");
  // Tras confirmar, el backend otorga el rol `promoter`; refrescamos la sesión
  // para que el navbar/roles reflejen el nuevo acceso al panel.
  const { update } = useSession();

  const accept = useApiMutation({
    mutationFn: () => confirmPromoterAssociation(invitation.id, token),
    successMessage: t("accepted"),
    invalidateKeys: [queryKeys.promoterAssociations],
    onSuccess: () => {
      // Con payload: `update()` a secas no dispara el callback jwt en NextAuth
      // v5, así que el rol nuevo no llegaba a la sesión y el panel seguía
      // invisible hasta volver a iniciar sesión.
      void update({ refreshProfile: true });
    },
  });

  const reject = useApiMutation({
    mutationFn: () => rejectPromoterAssociation(invitation.id, token),
    successMessage: t("rejected"),
    invalidateKeys: [queryKeys.promoterAssociations],
  });

  const busy = accept.isPending || reject.isPending;

  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <div className="rounded-md bg-muted p-2 text-muted-foreground">
          <Buildings className="h-5 w-5" weight="duotone" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-base">{invitation.name}</CardTitle>
          <CardDescription>{t("cardDescription")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => reject.mutate(undefined)}
          disabled={busy}
        >
          <X className="h-4 w-4" /> {t("reject")}
        </Button>
        <Button
          size="sm"
          onClick={() => accept.mutate(undefined)}
          disabled={busy}
        >
          <Check className="h-4 w-4" weight="bold" />
          {accept.isPending ? t("confirming") : t("accept")}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Solicitudes de asociación de promotor dirigidas al usuario (por su correo o
 * cuenta). Visible para cualquier usuario autenticado: la persona acepta o
 * rechaza ANTES de quedar ligada a la empresa (consentimiento del promotor).
 */
export function PromoterInvitations() {
  const t = useTranslations("account.invitations");
  const { data: session, status } = useSession();
  const token = session?.accessToken ?? "";

  const query = useQuery({
    queryKey: queryKeys.promoterAssociations,
    queryFn: () => listMyPromoterAssociations(token),
    enabled: status === "authenticated" && Boolean(token),
  });

  if (query.isError) {
    return (
      <ErrorState
        description={t("loadError")}
        onRetry={() => query.refetch()}
      />
    );
  }

  if (status === "loading" || query.isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton
            key={`inv-skeleton-${i}`}
            className="h-28 w-full rounded-lg"
          />
        ))}
      </div>
    );
  }

  const invitations = query.data ?? [];
  if (invitations.length === 0) {
    return (
      <EmptyState
        icon={<Buildings className="h-8 w-8" weight="duotone" />}
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((invitation) => (
        <InvitationCard
          key={invitation.id}
          invitation={invitation}
          token={token}
        />
      ))}
    </div>
  );
}
