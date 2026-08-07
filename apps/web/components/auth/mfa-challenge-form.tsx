"use client";

import {
  EnvelopeSimple,
  Key,
  ShieldCheck,
  SpinnerGap,
  Timer,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@urnight/ui";
import {
  EMPTY_OTP_DIGITS,
  OtpCodeInput,
} from "@/components/auth/otp-code-input";
import {
  sendMfaEmailAction,
  useMfaRecoveryAction,
  verifyMfaAction,
  verifyMfaEmailAction,
} from "@/lib/auth-actions";
import { autoSubmitOtpCode, secondsUntil } from "@/lib/auth/otp-flow";

interface MfaChallengeFormProps {
  callbackUrl: string;
  expiresAt?: string;
  initialSeconds: number;
}

type MfaMethod = "authenticator" | "email" | "recovery";

interface EmailDelivery {
  sentTo: string;
  expiresAt: string;
  resendAvailableAt: string;
}

export function MfaChallengeForm({
  callbackUrl,
  expiresAt,
  initialSeconds,
}: MfaChallengeFormProps) {
  const t = useTranslations("twoFactor");
  const [digits, setDigits] = useState<string[]>([...EMPTY_OTP_DIGITS]);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [method, setMethod] = useState<MfaMethod>("authenticator");
  const [methodDialogOpen, setMethodDialogOpen] = useState(false);
  const [methodError, setMethodError] = useState<string | null>(null);
  const [emailUnavailableReason, setEmailUnavailableReason] = useState<string | null>(null);
  const [emailDelivery, setEmailDelivery] = useState<EmailDelivery | null>(null);
  const [resendRemaining, setResendRemaining] = useState(0);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [terminalCode, setTerminalCode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [inputVersion, setInputVersion] = useState(0);
  const [pendingOperation, setPendingOperation] = useState<"verify" | "sendEmail" | null>(null);
  const lastSubmittedCode = useRef<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!expiresAt) return;
    const refresh = () => {
      setRemaining(secondsUntil(expiresAt));
    };
    refresh();
    const interval = window.setInterval(refresh, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (!emailDelivery) return;
    const refresh = () => {
      setResendRemaining(secondsUntil(emailDelivery.resendAvailableAt));
    };
    refresh();
    const interval = window.setInterval(refresh, 1000);
    return () => window.clearInterval(interval);
  }, [emailDelivery]);

  const expired = remaining <= 0 || terminalCode === "identity/mfa-challenge-expired";
  const locked = terminalCode === "identity/mfa-locked";
  const code = digits.join("");
  const canSubmit = method === "recovery"
    ? recoveryCode.trim().length > 0
    : code.length === 6;

  const submit = useCallback((submittedCode?: string) => {
    if (!canSubmit || expired || locked) return;
    setFormError(null);
    setPendingOperation("verify");
    startTransition(async () => {
      const result = method === "recovery"
        ? await useMfaRecoveryAction(recoveryCode)
        : method === "email"
          ? await verifyMfaEmailAction(submittedCode ?? code)
          : await verifyMfaAction(submittedCode ?? code);
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
        setPendingOperation(null);
        return;
      }
      if (method === "recovery") {
        setRecoveryCode("");
      } else {
        lastSubmittedCode.current = null;
        setDigits([...EMPTY_OTP_DIGITS]);
        setInputVersion((current) => current + 1);
      }
      setPendingOperation(null);
    });
  }, [callbackUrl, canSubmit, code, expired, locked, method, recoveryCode, t]);

  useEffect(() => {
    if (method === "recovery" || digits.some((digit) => !digit)) {
      lastSubmittedCode.current = null;
      return;
    }
    const completedCode = autoSubmitOtpCode(
      digits,
      lastSubmittedCode.current,
      pending || expired || locked,
    );
    if (!completedCode) return;
    lastSubmittedCode.current = completedCode;
    submit(completedCode);
  }, [digits, expired, locked, method, pending, submit]);

  function resetInputs(nextMethod: MfaMethod) {
    setMethod(nextMethod);
    setFormError(null);
    setDigits([...EMPTY_OTP_DIGITS]);
    setRecoveryCode("");
    setInputVersion((current) => current + 1);
    lastSubmittedCode.current = null;
  }

  function requestEmailCode(selectEmailMethod: boolean) {
    if (pending || expired || locked) return;
    setMethodError(null);
    setFormError(null);
    setPendingOperation("sendEmail");
    startTransition(async () => {
      const result = await sendMfaEmailAction();
      if (!result.ok) {
        if (result.code === "identity/mfa-email-unavailable") {
          setEmailUnavailableReason(
            result.error ?? t("methodSelector.emailUnavailable"),
          );
        } else if (
          result.code === "identity/mfa-challenge-expired" ||
          result.code === "identity/mfa-locked"
        ) {
          setTerminalCode(result.code);
          setMethodDialogOpen(false);
        } else if (selectEmailMethod) {
          setMethodError(result.error ?? t("errors.generic"));
        } else {
          setFormError(result.error ?? t("errors.generic"));
        }
        setPendingOperation(null);
        return;
      }

      if (!result.sentTo || !result.expiresAt || !result.resendAvailableAt) {
        const error = t("errors.generic");
        if (selectEmailMethod) setMethodError(error);
        else setFormError(error);
        setPendingOperation(null);
        return;
      }

      setEmailDelivery({
        sentTo: result.sentTo,
        expiresAt: result.expiresAt,
        resendAvailableAt: result.resendAvailableAt,
      });
      setEmailUnavailableReason(null);
      resetInputs("email");
      setMethodDialogOpen(false);
      setPendingOperation(null);
    });
  }

  function openMethodDialog() {
    setMethodError(null);
    setMethodDialogOpen(true);
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex size-[110px] items-center justify-center rounded-[32px] border border-accent-border bg-accent shadow-sm">
        {method === "recovery" ? (
          <Key className="size-12 text-rose" weight="duotone" />
        ) : method === "email" ? (
          <EnvelopeSimple className="size-12 text-rose" weight="duotone" />
        ) : (
          <ShieldCheck className="size-12 text-rose" weight="duotone" />
        )}
      </div>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-foreground">
        {method === "recovery"
          ? t("recoveryDescription")
          : method === "email" && emailDelivery
            ? t("email.description", { email: emailDelivery.sentTo })
            : t("description")}
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

        {method === "recovery" ? (
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

        {method === "email" && emailDelivery ? (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <span>{t("email.sentTo", { email: emailDelivery.sentTo })}</span>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => requestEmailCode(false)}
              disabled={pending || resendRemaining > 0}
            >
              {pendingOperation === "sendEmail"
                ? t("email.sending")
                : resendRemaining > 0
                  ? t("email.resendIn", { seconds: resendRemaining })
                  : t("email.resend")}
            </Button>
          </div>
        ) : null}

        {!expired && !locked ? (
          <Button
            type="submit"
            className="w-full"
            disabled={!canSubmit || pending}
          >
            {pendingOperation === "verify" ? (
              <SpinnerGap className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {pendingOperation === "verify" ? t("verifying") : t("verify")}
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link href="/login">{t("startAgain")}</Link>
          </Button>
        )}

        {!expired && !locked ? (
          <div className="flex flex-wrap justify-center gap-2">
            {method !== "authenticator" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => resetInputs("authenticator")}
              >
                {t("useAuthenticator")}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openMethodDialog}
            >
              {t("tryAnotherMethod")}
            </Button>
          </div>
        ) : null}
      </form>

      <Button variant="link" size="sm" className="mt-3" asChild>
        <Link href="/login">{t("backToLogin")}</Link>
      </Button>

      <Dialog open={methodDialogOpen} onOpenChange={setMethodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("methodSelector.title")}</DialogTitle>
            <DialogDescription>
              {t("methodSelector.description")}
            </DialogDescription>
          </DialogHeader>
          {methodError ? (
            <Alert variant="destructive" className="text-left">
              <AlertDescription>{methodError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full items-start justify-start gap-3 whitespace-normal p-4 text-left"
              onClick={() => requestEmailCode(true)}
              disabled={pending || Boolean(emailUnavailableReason)}
            >
              {pendingOperation === "sendEmail" ? (
                <SpinnerGap
                  className="mt-0.5 size-5 shrink-0 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <EnvelopeSimple
                  className="mt-0.5 size-5 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span>
                <span className="block font-semibold">
                  {pendingOperation === "sendEmail"
                    ? t("methodSelector.sendingEmail")
                    : t("methodSelector.email")}
                </span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  {t("methodSelector.emailDescription")}
                </span>
              </span>
            </Button>
            {emailUnavailableReason ? (
              <p className="text-left text-sm text-muted-foreground">
                {emailUnavailableReason}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full items-start justify-start gap-3 whitespace-normal p-4 text-left"
              onClick={() => {
                resetInputs("recovery");
                setMethodDialogOpen(false);
              }}
              disabled={pending}
            >
              <Key className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <span>
                <span className="block font-semibold">
                  {t("methodSelector.recovery")}
                </span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  {t("methodSelector.recoveryDescription")}
                </span>
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
