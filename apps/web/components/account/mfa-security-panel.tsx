"use client";

import { ShieldWarning } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@urnight/ui";
import { getMfaStatus } from "@/lib/api/mfa";
import { queryKeys } from "@/lib/api/query-keys";
import { MfaEnabledCard } from "./mfa-enabled-card";
import { MfaEnrollmentFlow } from "./mfa-enrollment-flow";
import { MfaRecoveryCodes } from "./mfa-recovery-codes";

interface VisibleRecoveryCodes {
  codes: string[];
  sessionRefreshFailed: boolean;
}

export function MfaSecurityPanel() {
  const t = useTranslations("account.security");
  const { data: session, status: sessionStatus } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";
  const [visibleCodes, setVisibleCodes] = useState<VisibleRecoveryCodes | null>(null);
  const [refreshWarning, setRefreshWarning] = useState(false);
  const statusQuery = useQuery({
    queryKey: queryKeys.mfaStatus,
    queryFn: () => getMfaStatus(token),
    enabled: sessionStatus === "authenticated" && Boolean(token),
  });

  function refreshStatus() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.mfaStatus });
  }

  if (visibleCodes) {
    return (
      <MfaRecoveryCodes
        codes={visibleCodes.codes}
        sessionRefreshFailed={visibleCodes.sessionRefreshFailed}
        onDone={() => {
          setVisibleCodes(null);
          refreshStatus();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {session?.user.mfaPending ? (
        <Alert className="border-accent-border bg-accent/60">
          <ShieldWarning aria-hidden="true" className="size-5 text-rose" />
          <AlertTitle>{t("pending.title")}</AlertTitle>
          <AlertDescription>{t("pending.description")}</AlertDescription>
        </Alert>
      ) : null}

      {refreshWarning ? (
        <Alert variant="destructive">
          <AlertDescription>{t("refreshFailed")}</AlertDescription>
        </Alert>
      ) : null}

      {sessionStatus === "loading" || statusQuery.isPending ? (
        <Card aria-busy="true" aria-label={t("loading")}>
          <CardHeader>
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-11 w-36" />
          </CardContent>
        </Card>
      ) : statusQuery.isError || !statusQuery.data ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("loadError.title")}</CardTitle>
            <CardDescription>{t("loadError.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" onClick={() => statusQuery.refetch()}>
              {t("loadError.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : statusQuery.data.enrolled ? (
        <MfaEnabledCard
          status={statusQuery.data}
          token={token}
          onRecoveryCodes={(codes) =>
            setVisibleCodes({ codes, sessionRefreshFailed: false })
          }
          onRevoked={({ sessionRefreshFailed }) => {
            setRefreshWarning(sessionRefreshFailed);
            refreshStatus();
          }}
        />
      ) : (
        <MfaEnrollmentFlow
          token={token}
          onConfirmed={(codes, options) => {
            setVisibleCodes({
              codes,
              sessionRefreshFailed: options.sessionRefreshFailed,
            });
            refreshStatus();
          }}
        />
      )}
    </div>
  );
}
