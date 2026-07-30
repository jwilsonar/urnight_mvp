"use client";

/* Pantalla del prototipo (09 · Verifica email). Vista demo: la verificación
   real por enlace requiere backend de emails aún no implementado. */

import { ArrowsClockwise, Check, EnvelopeSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge, Button } from "@urnight/ui";
import { AuthShell } from "@/components/auth/auth-shell";

export default function VerifyEmailPage() {
  const t = useTranslations("verifyEmail");
  const [resent, setResent] = useState(false);

  return (
    <AuthShell>
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-[110px] items-center justify-center rounded-[32px] border border-accent-border bg-accent shadow-glow-lg">
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
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setResent(true)}
            >
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
