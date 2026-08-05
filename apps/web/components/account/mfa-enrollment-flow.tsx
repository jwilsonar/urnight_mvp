"use client";

import { Check, Copy, QrCode, ShieldCheck } from "@phosphor-icons/react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { StartMfaEnrollmentResponse } from "@urnight/contracts";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@urnight/ui";
import {
  EMPTY_OTP_DIGITS,
  OtpCodeInput,
} from "@/components/auth/otp-code-input";
import { BrandQr } from "@/components/shared/brand-qr";
import {
  confirmMfaEnrollment,
  startMfaEnrollment,
} from "@/lib/api/mfa";
import { getMfaUiErrorKey } from "./mfa-ui-error";

export function MfaEnrollmentFlow({
  token,
  onConfirmed,
}: {
  token: string;
  onConfirmed: (
    codes: string[],
    options: { sessionRefreshFailed: boolean },
  ) => void;
}) {
  const t = useTranslations("account.security.enrollment");
  const { update } = useSession();
  const [setup, setSetup] = useState<StartMfaEnrollmentResponse | null>(null);
  const [digits, setDigits] = useState<string[]>([...EMPTY_OTP_DIGITS]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingAction, setPendingAction] = useState<"start" | "confirm" | null>(null);

  async function start() {
    setPendingAction("start");
    setError(null);
    try {
      setSetup(await startMfaEnrollment(token));
    } catch (requestError) {
      setError(t(getMfaUiErrorKey(requestError)));
    } finally {
      setPendingAction(null);
    }
  }

  async function copySecret() {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function confirm() {
    if (!setup || digits.some((digit) => !digit)) return;
    setPendingAction("confirm");
    setError(null);
    try {
      const { recoveryCodes } = await confirmMfaEnrollment(
        { code: digits.join("") },
        token,
      );
      setSetup(null);
      setDigits([...EMPTY_OTP_DIGITS]);

      let sessionRefreshFailed = false;
      try {
        const refreshed = await update({ forceTokenRefresh: true });
        sessionRefreshFailed = !refreshed?.accessToken || Boolean(refreshed.error);
      } catch {
        sessionRefreshFailed = true;
      }
      onConfirmed(recoveryCodes, { sessionRefreshFailed });
    } catch (requestError) {
      setDigits([...EMPTY_OTP_DIGITS]);
      setError(t(getMfaUiErrorKey(requestError)));
    } finally {
      setPendingAction(null);
    }
  }

  if (!setup) {
    return (
      <Card>
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-lg border border-accent-border bg-accent">
            <ShieldCheck className="size-6 text-rose" weight="duotone" />
          </div>
          <CardTitle className="font-heading text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button
            type="button"
            onClick={start}
            disabled={pendingAction === "start" || !token}
          >
            {pendingAction === "start" ? t("starting") : t("start")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex size-11 items-center justify-center rounded-lg border border-accent-border bg-accent">
          <QrCode className="size-6 text-rose" weight="duotone" />
        </div>
        <CardTitle className="font-heading text-xl">{t("scanTitle")}</CardTitle>
        <CardDescription>{t("scanDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid items-center gap-5 sm:grid-cols-[220px_1fr]">
          <div className="mx-auto">
            <BrandQr value={setup.otpauthUri} alt={t("qrAlt")} size={220} />
          </div>
          <div className="min-w-0 space-y-3">
            <p className="text-sm text-muted-foreground">{t("manualHint")}</p>
            <code className="block break-all rounded-md border bg-muted/50 p-3 font-mono text-sm font-semibold">
              {setup.secret}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={copySecret}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? t("secretCopied") : t("copySecret")}
            </Button>
          </div>
        </div>

        <div className="space-y-4 border-t pt-5">
          <div>
            <h2 className="font-heading text-base font-bold">{t("confirmTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("confirmDescription")}
            </p>
          </div>
          <OtpCodeInput
            digits={digits}
            onChange={setDigits}
            digitLabel={(position) => t("digitAria", { number: position })}
            disabled={pendingAction === "confirm"}
          />
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={confirm}
            disabled={digits.some((digit) => !digit) || pendingAction === "confirm"}
          >
            {pendingAction === "confirm" ? t("confirming") : t("confirm")}
          </Button>
        </div>
        <span className="sr-only" aria-live="polite">
          {copied ? t("secretCopied") : ""}
        </span>
      </CardContent>
    </Card>
  );
}
