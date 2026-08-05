"use client";

import { Key, ShieldCheck, Timer } from "@phosphor-icons/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import {
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
} from "@urnight/ui";
import {
  EMPTY_OTP_DIGITS,
  OtpCodeInput,
} from "@/components/auth/otp-code-input";
import {
  useMfaRecoveryAction,
  verifyMfaAction,
} from "@/lib/auth-actions";

interface MfaChallengeFormProps {
  callbackUrl: string;
  expiresAt?: string;
  initialSeconds: number;
}

export function MfaChallengeForm({
  callbackUrl,
  expiresAt,
  initialSeconds,
}: MfaChallengeFormProps) {
  const t = useTranslations("twoFactor");
  const [digits, setDigits] = useState<string[]>([...EMPTY_OTP_DIGITS]);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [terminalCode, setTerminalCode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [inputVersion, setInputVersion] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!expiresAt) return;
    const refresh = () => {
      const next = Math.max(
        0,
        Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000),
      );
      setRemaining(next);
    };
    refresh();
    const interval = window.setInterval(refresh, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  const expired = remaining <= 0 || terminalCode === "identity/mfa-challenge-expired";
  const locked = terminalCode === "identity/mfa-locked";
  const code = digits.join("");
  const canSubmit = recoveryMode
    ? recoveryCode.trim().length > 0
    : code.length === 6;

  function submit() {
    if (!canSubmit || expired || locked) return;
    setFormError(null);
    startTransition(async () => {
      const result = recoveryMode
        ? await useMfaRecoveryAction(recoveryCode)
        : await verifyMfaAction(code);
      if (result.ok) {
        window.location.assign(callbackUrl);
        return;
      }

      setFormError(result.error ?? t("errors.generic"));
      if (
        result.code === "identity/mfa-challenge-expired" ||
        result.code === "identity/mfa-locked"
      ) {
        setTerminalCode(result.code);
        return;
      }
      if (recoveryMode) {
        setRecoveryCode("");
      } else {
        setDigits([...EMPTY_OTP_DIGITS]);
        setInputVersion((current) => current + 1);
      }
    });
  }

  function toggleMethod() {
    setRecoveryMode((current) => !current);
    setFormError(null);
    setDigits([...EMPTY_OTP_DIGITS]);
    setRecoveryCode("");
    setInputVersion((current) => current + 1);
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex size-[110px] items-center justify-center rounded-[32px] border border-accent-border bg-accent shadow-sm">
        {recoveryMode ? (
          <Key className="size-12 text-rose" weight="duotone" />
        ) : (
          <ShieldCheck className="size-12 text-rose" weight="duotone" />
        )}
      </div>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-foreground">
        {recoveryMode ? t("recoveryDescription") : t("description")}
      </p>

      <div
        aria-live="polite"
        className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground"
      >
        <Timer className="size-4 text-rose" aria-hidden="true" />
        {expired
          ? t("expired")
          : t("expiresIn", { time: formatRemaining(remaining) })}
      </div>

      <form
        className="mt-7 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        noValidate
      >
        {formError ? (
          <Alert variant="destructive" className="text-left">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {recoveryMode ? (
          <div className="space-y-2 text-left">
            <Label htmlFor="mfa-recovery-code">{t("recoveryLabel")}</Label>
            <Input
              id="mfa-recovery-code"
              value={recoveryCode}
              onChange={(event) => setRecoveryCode(event.target.value)}
              placeholder={t("recoveryPlaceholder")}
              autoComplete="one-time-code"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={pending || expired || locked}
              autoFocus
            />
          </div>
        ) : (
          <OtpCodeInput
            key={inputVersion}
            digits={digits}
            onChange={setDigits}
            digitLabel={(position) => t("digitAria", { number: position })}
            disabled={pending || expired || locked}
            autoFocus
          />
        )}

        {!expired && !locked ? (
          <Button
            type="submit"
            className="w-full"
            disabled={!canSubmit || pending}
          >
            {pending ? t("verifying") : t("verify")}
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link href="/login">{t("startAgain")}</Link>
          </Button>
        )}

        {!expired && !locked ? (
          <Button type="button" variant="ghost" size="sm" onClick={toggleMethod}>
            {recoveryMode ? t("useAuthenticator") : t("useRecovery")}
          </Button>
        ) : null}
      </form>

      <Button variant="link" size="sm" className="mt-3" asChild>
        <Link href="/login">{t("backToLogin")}</Link>
      </Button>
    </div>
  );
}

function formatRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
