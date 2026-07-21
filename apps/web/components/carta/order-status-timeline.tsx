"use client";

import { Check } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@urnight/ui";
import { type CartaOrderStatusDemo } from "@/lib/mock/carta";

const STEPS = [
  "received",
  "preparing",
  "ready",
] as const satisfies readonly CartaOrderStatusDemo[];

/**
 * Timeline demo del pedido: avanza solo (temporizadores) para mostrar el flujo
 * recibido → preparando → listo. Con backend real, el estado llega por
 * polling/websocket del módulo de pedidos.
 */
export function OrderStatusTimeline() {
  const t = useTranslations("carta.status");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setActiveIndex(1), 6000);
    const t2 = setTimeout(() => setActiveIndex(2), 14000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <ol className="space-y-0" aria-label={t("aria")}>
      {STEPS.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <li key={step} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Conector vertical: se "llena" con transición al completar el paso */}
            {!isLast ? (
              <span
                aria-hidden
                className="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 overflow-hidden rounded-full bg-border"
              >
                <span
                  className={cn(
                    "block h-full w-full origin-top bg-primary transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
                    done ? "scale-y-100" : "scale-y-0",
                  )}
                />
              </span>
            ) : null}

            {/* Punto de estado */}
            <span
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,border-color,transform] duration-300",
                done && "border-primary bg-primary text-primary-foreground",
                active && "rv-breathe border-primary bg-accent text-rose",
                !done &&
                  !active &&
                  "border-border bg-surface text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="size-3.5" weight="bold" />
              ) : (
                <span
                  className={cn(
                    "size-2 rounded-full transition-colors duration-300",
                    active ? "bg-rose" : "bg-border",
                  )}
                />
              )}
            </span>

            <div
              className={cn(
                "transition-opacity duration-300",
                !done && !active && "opacity-50",
              )}
            >
              <p className="font-heading text-sm font-bold">
                {t(`${step}.label`)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(`${step}.hint`)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
