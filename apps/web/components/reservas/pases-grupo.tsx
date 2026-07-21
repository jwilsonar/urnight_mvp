"use client";

import { ShareNetwork } from "@phosphor-icons/react";
import { Badge, Button, cn } from "@urnight/ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { PaseReservaDemo } from "@/lib/mock/reservas";

interface PasesGrupoProps {
  pases: PaseReservaDemo[];
}

function PseudoQr({ codigo }: { codigo: string }) {
  const semilla = Array.from(codigo).reduce(
    (total, caracter) => total + caracter.charCodeAt(0),
    0,
  );

  return (
    <div
      aria-hidden="true"
      className="grid size-14 shrink-0 grid-cols-7 gap-0.5 rounded-sm border bg-background p-1"
    >
      {Array.from({ length: 49 }, (_, indice) => {
        const fila = Math.floor(indice / 7);
        const columna = indice % 7;
        // Tres marcas fijas y un patrón por código hacen reconocible el QR demo.
        const esMarca =
          (fila < 3 && columna < 3) ||
          (fila < 3 && columna > 3) ||
          (fila > 3 && columna < 3);
        const activo =
          esMarca || (semilla + indice * 7 + fila * columna) % 3 !== 0;

        return (
          <span
            key={indice}
            className={cn(
              "aspect-square rounded-[1px]",
              activo ? "bg-foreground" : "bg-muted",
            )}
          />
        );
      })}
    </div>
  );
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
    const texto = `${t("shareText", { code: "UR-DEMO-4821" })}\n${codigos}`;

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {pases.map((pase) => (
          <article
            key={pase.id}
            className="min-w-0 rounded-md border bg-card p-3"
          >
            <p className="rv-eyebrow !text-muted-foreground">
              {t("counter", { current: pase.indice, total: pases.length })}
            </p>
            <div className="mt-3 flex flex-col items-center gap-3">
              <PseudoQr codigo={pase.codigo} />
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
