"use client";

/* Pantalla 36 del prototipo (Programa de referidos). Demo frontend-only:
   el código y los contadores llegan con el backend de referidos. Copiar
   link funciona en local (clipboard). */

import { Check, LinkSimple, WhatsappLogo } from "@phosphor-icons/react";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge, Button, Card } from "@urnight/ui";
import { REFERIDOS_DEMO } from "@/lib/mock/fidelizacion";

export default function ReferidosPage() {
  const t = useTranslations("account.referrals");
  const format = useFormatter();
  const referrals = t.raw("items") as { status: string; date: string }[];
  const [copied, setCopied] = useState(false);
  const pct = Math.round(
    (REFERIDOS_DEMO.invitados / REFERIDOS_DEMO.meta) * 100,
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `https://ravenue.pe/r/${REFERIDOS_DEMO.codigo.toLowerCase()}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard no disponible: el botón simplemente no confirma */
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-xl font-extrabold tracking-tight">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Badge variant="info">{t("demo")}</Badge>
      </div>

      {/* Card del código con gradiente dorado→carmín del prototipo */}
      <div className="rounded-xl border border-warning-border bg-[linear-gradient(135deg,var(--warning-soft),var(--accent-soft))] p-6 text-center sm:p-7">
        <p className="rv-eyebrow text-warning">{t("inviteCode")}</p>
        <p className="mt-3 font-mono text-3xl font-extrabold tracking-[0.16em] sm:text-4xl">
          {REFERIDOS_DEMO.codigo}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <Button onClick={copyLink}>
            {copied ? (
              <Check className="size-4" />
            ) : (
              <LinkSimple className="size-4" />
            )}
            {copied ? t("copied") : t("copyLink")}
          </Button>
          <Button variant="secondary" disabled>
            <WhatsappLogo className="size-4" weight="duotone" /> WhatsApp
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="rv-eyebrow !text-muted-foreground">
            {t("invitedFriends")}
          </p>
          <p className="mt-1 font-heading text-3xl font-extrabold">
            {REFERIDOS_DEMO.invitados}{" "}
            <span className="text-sm font-medium text-muted-foreground">
              / {t("goal", { count: REFERIDOS_DEMO.meta })}
            </span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,var(--color-primary))]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">
            {t.rich("remaining", {
              count: REFERIDOS_DEMO.meta - REFERIDOS_DEMO.invitados,
              strong: (chunks: React.ReactNode) => (
                <strong className="text-foreground">{chunks}</strong>
              ),
              reward: (chunks: React.ReactNode) => (
                <strong className="text-warning">{chunks}</strong>
              ),
            })}
          </p>
        </Card>
        <Card className="p-5">
          <p className="rv-eyebrow !text-muted-foreground">
            {t("pointsEarned")}
          </p>
          <p className="mt-1 font-heading text-3xl font-extrabold">
            + {format.number(REFERIDOS_DEMO.puntos)}{" "}
            <span className="text-sm font-medium text-muted-foreground">
              {t("pointsShort")}
            </span>
          </p>
          <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
            {t.rich("pointsDescription", {
              points: (chunks: React.ReactNode) => (
                <strong className="text-foreground">{chunks}</strong>
              ),
            })}
          </p>
        </Card>
      </div>

      <h3 className="mb-3.5 mt-7 text-[15px] font-bold">
        {t("yourReferrals")}
      </h3>
      <Card className="overflow-hidden p-0">
        {REFERIDOS_DEMO.lista.map((r, index) => (
          <div
            key={r.nombre}
            className="flex items-center gap-3.5 border-b px-4 py-3.5 last:border-b-0"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-accent-border bg-accent text-sm font-bold text-rose">
              {r.nombre[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{r.nombre}</p>
              <p
                className={`text-xs ${r.completado ? "text-success" : "text-muted-foreground"}`}
              >
                {referrals[index]?.status}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {referrals[index]?.date}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
