"use client";

import { Basket, Minus, Plus, Trash } from "@phosphor-icons/react";
import { m } from "framer-motion";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@urnight/ui";
import { useCart } from "@/components/carta/cart-provider";
import { SplitBillDialog } from "@/components/carta/split-bill-dialog";
import { CARTA_ITEMS_DEMO } from "@/lib/mock/carta";

/**
 * FAB del pedido: visible con items en el carrito; abre el resumen para
 * ajustar cantidades y confirmar el pedido demo (pago al recoger).
 */
export function CartFab({
  pickupZone,
  onConfirm,
}: {
  pickupZone: string;
  onConfirm: () => void;
}) {
  const t = useTranslations("carta.cart");
  const cartaT = useTranslations("carta");
  const format = useFormatter();
  const money = (value: number) =>
    format.number(value, { style: "currency", currency: "PEN" });
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);

  if (cart.count === 0) return null;

  const confirm = () => {
    setOpen(false);
    onConfirm();
  };

  return (
    <>
      {/* FAB fijo, respeta safe-area en móvil */}
      <m.div
        className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        initial={{ y: 96, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
      >
        <Button
          size="lg"
          className="w-full max-w-md justify-between shadow-float"
          onClick={() => setOpen(true)}
          aria-label={t("viewAria", {
            count: cart.count,
            total: money(cart.totalSoles),
          })}
        >
          <span className="flex items-center gap-2">
            <Basket className="size-5" weight="duotone" />
            {t("view")}{" "}
            <m.span
              key={cart.count}
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            >
              ({cart.count})
            </m.span>
          </span>
          <span className="tabular-nums">{money(cart.totalSoles)}</span>
        </Button>
      </m.div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-lg rounded-t-2xl border-t"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="font-heading text-xl font-extrabold">
              {t("title")}
            </SheetTitle>
            <SheetDescription>
              {t.rich("pickup", {
                zone: pickupZone,
                strong: (chunks: React.ReactNode) => (
                  <span className="font-semibold text-foreground">
                    {chunks}
                  </span>
                ),
              })}
            </SheetDescription>
          </SheetHeader>

          <div className="max-h-[45vh] space-y-3 overflow-y-auto py-4">
            {cart.lines.map((line) => {
              const item = CARTA_ITEMS_DEMO.find((i) => i.id === line.itemId);
              if (!item) return null;
              return (
                <div
                  key={line.itemId}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {cartaT(`items.${item.id}.name`)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {t("each", { amount: money(item.priceSoles) })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-full"
                      aria-label={t("removeAria", {
                        item: cartaT(`items.${item.id}.name`),
                      })}
                      onClick={() =>
                        cart.setQuantity(line.itemId, line.quantity - 1)
                      }
                    >
                      {line.quantity === 1 ? (
                        <Trash className="size-3.5" />
                      ) : (
                        <Minus className="size-3.5" weight="bold" />
                      )}
                    </Button>
                    <span className="min-w-5 text-center text-sm font-bold tabular-nums">
                      {line.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-full"
                      aria-label={t("addAria", {
                        item: cartaT(`items.${item.id}.name`),
                      })}
                      onClick={() =>
                        cart.setQuantity(line.itemId, line.quantity + 1)
                      }
                    >
                      <Plus className="size-3.5" weight="bold" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("total")}
              </span>
              <span className="font-heading text-lg font-extrabold tabular-nums">
                {money(cart.totalSoles)}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setSplitOpen(true)}
              >
                {t("split")}
              </Button>
              <Button size="lg" onClick={confirm}>
                {t("confirm")}
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {t("demoNote")}
            </p>
          </div>
        </SheetContent>
      </Sheet>
      <SplitBillDialog
        open={splitOpen}
        onOpenChange={setSplitOpen}
        totalSoles={cart.totalSoles}
      />
    </>
  );
}
