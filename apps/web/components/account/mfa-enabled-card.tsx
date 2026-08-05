"use client";

import { ArrowsClockwise, ShieldCheck, Trash } from "@phosphor-icons/react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { MfaStatusResponse } from "@urnight/contracts";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
} from "@urnight/ui";
import { PasswordInput } from "@/components/auth/password-input";
import {
  regenerateMfaRecoveryCodes,
  revokeMfa,
} from "@/lib/api/mfa";
import { getMfaUiErrorKey } from "./mfa-ui-error";

type EnrolledMfaStatus = Extract<MfaStatusResponse, { enrolled: true }>;

export function MfaEnabledCard({
  status,
  token,
  onRecoveryCodes,
  onRevoked,
}: {
  status: EnrolledMfaStatus;
  token: string;
  onRecoveryCodes: (codes: string[]) => void;
  onRevoked: (options: { sessionRefreshFailed: boolean }) => void;
}) {
  const t = useTranslations("account.security.enabled");
  const locale = useLocale();
  const { update } = useSession();
  const [mode, setMode] = useState<"regenerate" | "revoke" | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function chooseMode(next: "regenerate" | "revoke") {
    setMode(next);
    setPassword("");
    setError(null);
  }

  async function submit() {
    if (!mode || !password) return;
    setPending(true);
    setError(null);
    try {
      if (mode === "regenerate") {
        const result = await regenerateMfaRecoveryCodes({ password }, token);
        setPassword("");
        onRecoveryCodes(result.recoveryCodes);
        return;
      }

      await revokeMfa({ password }, token);
      setPassword("");
      let sessionRefreshFailed = false;
      try {
        const refreshed = await update({ forceTokenRefresh: true });
        sessionRefreshFailed = !refreshed?.accessToken || Boolean(refreshed.error);
      } catch {
        sessionRefreshFailed = true;
      }
      onRevoked({ sessionRefreshFailed });
    } catch (requestError) {
      setError(t(getMfaUiErrorKey(requestError)));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex size-11 items-center justify-center rounded-lg border border-accent-border bg-accent">
              <ShieldCheck className="size-6 text-rose" weight="duotone" />
            </div>
            <CardTitle className="font-heading text-xl">{t("title")}</CardTitle>
            <CardDescription className="mt-1">{t("description")}</CardDescription>
          </div>
          <Badge variant="success">{t("active")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("confirmedAt")}</dt>
            <dd className="mt-1 font-semibold">
              <time dateTime={status.confirmedAt}>
                {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                  new Date(status.confirmedAt),
                )}
              </time>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("codesLeft")}</dt>
            <dd className="mt-1 font-semibold">
              {t("codesCount", { count: status.recoveryCodesLeft })}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => chooseMode("regenerate")}>
            <ArrowsClockwise className="size-4" />
            {t("regenerate")}
          </Button>
          <Button type="button" variant="destructive" onClick={() => chooseMode("revoke")}>
            <Trash className="size-4" />
            {t("revoke")}
          </Button>
        </div>

        {mode ? (
          <form
            className="space-y-4 rounded-lg border p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <div>
              <h2 className="font-heading text-base font-bold">
                {mode === "regenerate" ? t("regenerateTitle") : t("revokeTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "regenerate"
                  ? t("regenerateDescription")
                  : t("revokeDescription")}
              </p>
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="mfa-current-password">{t("password")}</Label>
              <PasswordInput
                id="mfa-current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={pending}
                autoFocus
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode(null)}
                disabled={pending}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant={mode === "revoke" ? "destructive" : "default"}
                disabled={!password || pending}
              >
                {pending
                  ? t("processing")
                  : mode === "regenerate"
                    ? t("confirmRegenerate")
                    : t("confirmRevoke")}
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
