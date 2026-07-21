"use client";

import { Minus, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@urnight/ui";
import { SPLIT_PARTICIPANTES_DEMO } from "@/lib/mock/split";

interface SplitBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalSoles: number;
}

export function SplitBillDialog({
  open,
  onOpenChange,
  totalSoles,
}: SplitBillDialogProps) {
  const t = useTranslations("carta.split");
  const format = useFormatter();
  const [personas, setPersonas] = useState(4);
  const [linksEnviados, setLinksEnviados] = useState<Set<string>>(
    () => new Set(),
  );
  const participantes = SPLIT_PARTICIPANTES_DEMO.slice(0, personas);

  function enviarLink(id: string) {
    setLinksEnviados((actuales) => new Set(actuales).add(id));
    // La confirmación temporal hace visible la interacción sin simular un cobro real.
    setTimeout(() => {
      setLinksEnviados((actuales) => {
        const siguientes = new Set(actuales);
        siguientes.delete(id);
        return siguientes;
      });
    }, 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-md border bg-surface p-4">
            <div>
              <p className="text-sm font-semibold">{t("people")}</p>
              <p className="text-xs text-muted-foreground">{t("range")}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label={t("removePerson")}
                disabled={personas === 2}
                onClick={() => setPersonas((actual) => Math.max(2, actual - 1))}
              >
                <Minus className="size-4" weight="bold" />
              </Button>
              <span className="min-w-6 text-center font-bold tabular-nums">
                {personas}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label={t("addPerson")}
                disabled={personas === 8}
                onClick={() => setPersonas((actual) => Math.min(8, actual + 1))}
              >
                <Plus className="size-4" weight="bold" />
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("perPerson")}
            </p>
            <p className="mt-1 font-heading text-4xl font-black text-rose tabular-nums">
              {format.number(totalSoles / personas, {
                style: "currency",
                currency: "PEN",
              })}
            </p>
          </div>

          <div className="divide-y rounded-md border">
            {participantes.map((participante) => (
              <div
                key={participante.id}
                className="flex items-center gap-3 px-3 py-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-rose">
                  {participante.nombre.charAt(0)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {participante.nombre}
                </span>
                {participante.pagado ? (
                  <Badge variant="success">{t("paid")}</Badge>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => enviarLink(participante.id)}
                  >
                    {linksEnviados.has(participante.id)
                      ? t("linkSent")
                      : t("sendLink")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <Badge variant="info">{t("demo")}</Badge>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
