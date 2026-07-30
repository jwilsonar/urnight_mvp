"use client";

/* Pantalla del prototipo (11 · Recuperar contraseña). Vista demo: el envío
   real del enlace requiere backend de recuperación aún no implementado. */

import { ArrowLeft, EnvelopeSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Badge, Button, Input, Label } from "@urnight/ui";
import { AuthShell } from "@/components/auth/auth-shell";

export default function RecoverPage() {
  const t = useTranslations("recover");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (email.trim()) setSent(true);
  }

  return (
    <AuthShell
      heroLabel={t("hero.label")}
      hero={
        <div>
          <p className="font-heading text-3xl font-extrabold leading-tight">
            {t("hero.title")}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {t("hero.description")}
          </p>
        </div>
      }
    >
      {sent ? (
        <div className="text-center">
          <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-2xl border border-accent-border bg-accent shadow-glow">
            <EnvelopeSimple className="size-10 text-rose" weight="duotone" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">
            {t("sent.title")}
          </h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t("sent.beforeEmail")}{" "}
            <strong className="text-foreground">{email}</strong>{" "}
            {t("sent.afterEmail")}
          </p>
          <div className="mt-4">
            <Badge variant="info">{t("demo")}</Badge>
          </div>
          <Button variant="outline" className="mt-7" asChild>
            <Link href="/login">
              <ArrowLeft className="size-4" /> {t("backToLogin")}
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">
            {t("title")}
          </h1>
          <p className="mb-7 mt-1.5 text-muted-foreground">
            {t("description")}
          </p>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="recover-email">{t("email")}</Label>
              <Input
                id="recover-email"
                type="email"
                required
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button type="submit" size="lg">
              {t("submit")}
            </Button>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-rose hover:underline"
            >
              <ArrowLeft className="size-4" /> {t("backToLogin")}
            </Link>
          </form>
        </>
      )}
    </AuthShell>
  );
}
