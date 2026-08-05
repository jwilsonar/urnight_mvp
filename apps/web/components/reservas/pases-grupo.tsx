"use client";

import { ShareNetwork } from "@phosphor-icons/react";
import { Badge, Button } from "@urnight/ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BrandQr } from "@/components/shared/brand-qr";
import type { PaseReservaDemo } from "@/lib/mock/reservas";

interface PasesGrupoProps {
  pases: PaseReservaDemo[];
}

export function PasesGrupo({ pases }: PasesGrupoProps) {
  const t = useTranslations("reserva.passes");

  async function copiarCodigos(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyError"));
    }
  }

  async function compartirPases() {
    const codigos = pases.map((pase) => pase.codigo).join("\n");
    const texto = `${t("shareText", { code: "RV-DEMO-4821" })}\n${codigos}`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: t("shareTitle"), text: texto });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }

    await copiarCodigos(codigos);
  }

  return (
    <section className="mt-8 text-left" aria-labelledby="pases-grupo-titulo">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3
            id="pases-grupo-titulo"
            className="font-heading text-xl font-extrabold"
          >
            {t("title")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={compartirPases}
        >
          <ShareNetwork className="size-4" weight="duotone" /> {t("share")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {pases.map((pase) => (
          <article
            key={pase.id}
            className="min-w-0 rounded-md border bg-card p-3"
          >
            <p className="rv-eyebrow !text-muted-foreground">
              {t("counter", { current: pase.indice, total: pases.length })}
            </p>
            <div className="mt-3 flex flex-col items-center gap-3">
              <BrandQr
                value={pase.codigo}
                alt={t("qrAlt", { code: pase.codigo })}
                size={128}
              />
              <code className="w-full truncate text-center font-mono text-xs font-bold">
                {pase.codigo}
              </code>
            </div>
            <div className="mt-3 flex flex-col items-start gap-2 border-t pt-3">
              <Badge variant="secondary">
                {t.has(`zones.${pase.zonaId}`)
                  ? t(`zones.${pase.zonaId}`)
                  : pase.zonaId}
              </Badge>
              <p
                className="w-full truncate text-xs text-muted-foreground"
                title={pase.titular}
              >
                {pase.titular}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
