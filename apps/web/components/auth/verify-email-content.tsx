"use client";

import {
  ArrowsClockwise,
  Check,
  EnvelopeSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { IDENTITY_ERROR_CODES } from "@urnight/contracts";
import { Badge, Button } from "@urnight/ui";
import { confirmEmailChange } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { AuthShell } from "@/components/auth/auth-shell";

type EmailChangeState = "pending" | "success" | "expired" | "error";

export function VerifyEmailContent({
  emailChangeToken,
}: {
  emailChangeToken?: string;
}) {
  return emailChangeToken !== undefined ? (
    <EmailChangeVerification token={emailChangeToken} />
  ) : (
    <RegistrationEmailVerification />
  );
}

function EmailChangeVerification({ token }: { token: string }) {
  const t = useTranslations("verifyEmail.emailChange");
  const [state, setState] = useState<EmailChangeState>("pending");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (token.length < 10) {
      setState("error");
      return;
    }
    void confirmEmailChange({ token })
      .then(() => setState("success"))
      .catch((error: unknown) => {
        setState(
          error instanceof ApiError &&
            error.code === IDENTITY_ERROR_CODES.INVALID_TOKEN
            ? "expired"
            : "error",
        );
      });
  }, [token]);

  const icon =
    state === "success" ? (
      <Check className="size-12 text-success" weight="bold" />
    ) : state === "pending" ? (
      <ArrowsClockwise className="size-12 animate-spin text-rose" />
    ) : (
      <WarningCircle className="size-12 text-destructive" weight="duotone" />
    );

  return (
    <AuthShell>
      <div className="text-center" aria-live="polite">
        <div className="mx-auto mb-6 flex size-[110px] items-center justify-center rounded-[32px] border border-accent-border bg-accent shadow-sm">
          {icon}
        </div>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight">
          {t(`${state}.title`)}
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {t(`${state}.description`)}
        </p>
        {state !== "pending" ? (
          <Button className="mt-8" asChild>
            <Link href="/login">{t("goToLogin")}</Link>
          </Button>
        ) : null}
      </div>
    </AuthShell>
  );
}

function RegistrationEmailVerification() {
  const t = useTranslations("verifyEmail");
  const [resent, setResent] = useState(false);

  return (
    <AuthShell>
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-[110px] items-center justify-center rounded-[32px] border border-accent-border bg-accent shadow-sm">
          <EnvelopeSimple className="size-12 text-rose" weight="duotone" />
        </div>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {t("descriptionLineOne")}
          <br />
          {t("descriptionLineTwo")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">{t("notReceived")}</p>
          {resent ? (
            <span className="flex items-center gap-2 text-sm font-semibold text-success">
              <Check className="size-4" /> {t("resent")}
            </span>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setResent(true)}>
              <ArrowsClockwise className="size-4" /> {t("resend")}
            </Button>
          )}
          <Badge variant="info">{t("demo")}</Badge>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">{t("goToLogin")}</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
