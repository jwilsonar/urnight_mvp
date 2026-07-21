"use client";

/* Libro de Reclamaciones (obligatorio en Perú; enlazado desde el footer del
   prototipo). Demo frontend-only: el registro real del reclamo llega con el
   backend de soporte. */

import { BookOpen, Check } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@urnight/ui";

export default function ReclamacionesPage() {
  const t = useTranslations("complaints");
  const [tipo, setTipo] = useState("reclamo");
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl border border-success-border bg-success-soft">
          <Check className="size-9 text-success" weight="bold" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">
          {t("success.title")}
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {t.rich("success.description", {
            type: t(`type.${tipo}`),
            code: "LR-2026-000123",
            strong: (chunks: React.ReactNode) => (
              <strong className="text-foreground">{chunks}</strong>
            ),
          })}
        </p>
        <div className="mt-4">
          <Badge variant="info">{t("success.demo")}</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="rv-eyebrow flex items-center gap-2">
        <BookOpen className="size-4" weight="duotone" /> {t("eyebrow")}
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
        {t("description")}
      </p>

      <form
        onSubmit={submit}
        className="mt-9 space-y-5 rounded-lg border bg-card p-6"
        aria-describedby="reclamaciones-required"
      >
        <p
          id="reclamaciones-required"
          className="text-sm text-muted-foreground"
        >
          {t("required")}
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lr-tipo">{t("form.type")}</Label>
            <Select value={tipo} onValueChange={setTipo} name="tipo" required>
              <SelectTrigger id="lr-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reclamo">{t("form.claim")}</SelectItem>
                <SelectItem value="queja">{t("form.complaint")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lr-doc">{t("form.document")}</Label>
            <Input
              id="lr-doc"
              required
              placeholder={t("form.documentPlaceholder")}
            />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lr-nombre">{t("form.name")}</Label>
            <Input
              id="lr-nombre"
              required
              placeholder={t("form.namePlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lr-email">{t("form.email")}</Label>
            <Input
              id="lr-email"
              type="email"
              required
              placeholder={t("form.emailPlaceholder")}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lr-detalle">{t("form.detail")}</Label>
          <Textarea
            id="lr-detalle"
            required
            placeholder={t("form.detailPlaceholder")}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Badge variant="info">{t("form.demo")}</Badge>
          <Button type="submit">{t("form.submit")}</Button>
        </div>
      </form>
    </div>
  );
}
