"use client";

import { ArrowClockwise, Check, SpinnerGap, Warning } from "@phosphor-icons/react";
import type { LocalOrderResponse, LocalOrderStatus } from "@urnight/contracts";
import { Button, cn } from "@urnight/ui";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { getErrorMessage } from "@/lib/api/error-messages";
import { getMyLocalOrder } from "@/lib/api/local-orders";

const POLL_INTERVAL_MS = 10_000;
const STEPS = [
  "received",
  "preparing",
  "ready",
  "delivered",
] as const satisfies readonly LocalOrderStatus[];

/** Estado vivo: consulta cada 10 s solo mientras la pestaña está visible. */
export function OrderStatusTimeline({
  orderId,
  token,
  initialOrder,
  onOrderChange,
}: {
  orderId: string;
  token: string;
  initialOrder: LocalOrderResponse;
  onOrderChange: (order: LocalOrderResponse) => void;
}) {
  const t = useTranslations("carta.status");
  const errorT = useTranslations("auth.errors");
  const [order, setOrder] = useState(initialOrder);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const orderRef = useRef(initialOrder);
  const onOrderChangeRef = useRef(onOrderChange);
  const pollNowRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    onOrderChangeRef.current = onOrderChange;
  }, [onOrderChange]);

  useEffect(() => {
    orderRef.current = initialOrder;
    setOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
    let active = true;
    let timeoutId: number | undefined;
    let controller: AbortController | undefined;

    const isTerminal = (status: LocalOrderStatus) =>
      status === "delivered" || status === "cancelled";

    const schedule = () => {
      if (
        !active ||
        document.visibilityState !== "visible" ||
        isTerminal(orderRef.current.status)
      ) {
        return;
      }
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => void poll(), POLL_INTERVAL_MS);
    };

    const poll = async () => {
      if (
        !active ||
        document.visibilityState !== "visible" ||
        isTerminal(orderRef.current.status)
      ) {
        return;
      }

      controller?.abort();
      controller = new AbortController();
      setRefreshing(true);
      try {
        const nextOrder = await getMyLocalOrder(
          orderId,
          token,
          controller.signal,
        );
        if (!active) return;
        orderRef.current = nextOrder;
        setOrder(nextOrder);
        setError(null);
        onOrderChangeRef.current(nextOrder);
      } catch (pollError) {
        if (
          !active ||
          (pollError instanceof DOMException && pollError.name === "AbortError")
        ) {
          return;
        }
        setError(pollError);
      } finally {
        if (active) {
          setRefreshing(false);
          schedule();
        }
      }
    };

    pollNowRef.current = () => void poll();
    const onVisibilityChange = () => {
      window.clearTimeout(timeoutId);
      if (document.visibilityState === "visible") {
        void poll();
      } else {
        controller?.abort();
        setRefreshing(false);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    schedule();
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [orderId, token]);

  if (order.status === "cancelled") {
    return (
      <div
        className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        role="status"
      >
        <Warning className="mt-0.5 size-4 shrink-0" weight="duotone" />
        <div>
          <p className="font-semibold">{t("cancelled.label")}</p>
          <p className="mt-1 text-xs">{t("cancelled.hint")}</p>
        </div>
      </div>
    );
  }

  const activeIndex = STEPS.indexOf(order.status);

  return (
    <div className="space-y-4">
      <ol className="space-y-0" aria-label={t("aria")}>
        {STEPS.map((step, index) => {
          const done = index < activeIndex;
          const current = index === activeIndex;
          const isLast = index === STEPS.length - 1;
          return (
            <li key={step} className="relative flex gap-4 pb-8 last:pb-0">
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 overflow-hidden rounded-full bg-border"
                >
                  <span
                    className={cn(
                      "block h-full w-full origin-top bg-primary transition-transform duration-700 motion-reduce:transition-none",
                      done ? "scale-y-100" : "scale-y-0",
                    )}
                  />
                </span>
              ) : null}

              <span
                className={cn(
                  "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,border-color,transform] duration-300 motion-reduce:transition-none",
                  done && "border-primary bg-primary text-primary-foreground",
                  current &&
                    "rv-breathe border-accent-border bg-accent text-rose motion-reduce:animate-none",
                  !done &&
                    !current &&
                    "border-border bg-surface text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="size-3.5" weight="bold" />
                ) : (
                  <span
                    className={cn(
                      "size-2 rounded-full transition-colors duration-300 motion-reduce:transition-none",
                      current ? "bg-rose" : "bg-border",
                    )}
                  />
                )}
              </span>

              <div
                className={cn(
                  "transition-opacity duration-300 motion-reduce:transition-none",
                  !done && !current && "opacity-50",
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

      {refreshing ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
          <SpinnerGap
            className="size-3.5 animate-spin motion-reduce:animate-none"
            weight="bold"
          />
          {t("refreshing")}
        </p>
      ) : null}

      {error ? (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          <p>{getErrorMessage(error, (key) => errorT(key))}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => pollNowRef.current()}
          >
            <ArrowClockwise className="size-4" /> {t("retry")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
