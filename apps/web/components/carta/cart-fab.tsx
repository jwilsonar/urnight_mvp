'use client';

import { Basket, Minus, Plus, Trash } from '@phosphor-icons/react';
import { useState } from 'react';
import {
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@urnight/ui';
import { useCart } from '@/components/carta/cart-provider';
import { formatPEN } from '@/lib/utils';
import { CARTA_ITEMS_DEMO } from '@/lib/mock/carta';

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
  const cart = useCart();
  const [open, setOpen] = useState(false);

  if (cart.count === 0) return null;

  const confirm = () => {
    setOpen(false);
    onConfirm();
  };

  return (
    <>
      {/* FAB fijo, respeta safe-area en móvil */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button
          size="lg"
          className="w-full max-w-md justify-between shadow-float"
          onClick={() => setOpen(true)}
          aria-label={`Ver pedido: ${cart.count} productos, total ${formatPEN(cart.totalSoles)}`}
        >
          <span className="flex items-center gap-2">
            <Basket className="size-5" weight="duotone" />
            Ver pedido ({cart.count})
          </span>
          <span className="tabular-nums">{formatPEN(cart.totalSoles)}</span>
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl border-t">
          <SheetHeader className="text-left">
            <SheetTitle className="font-heading text-xl font-extrabold">Tu pedido</SheetTitle>
            <SheetDescription>
              Recoges en: <span className="font-semibold text-foreground">{pickupZone}</span> ·
              pagas al recoger.
            </SheetDescription>
          </SheetHeader>

          <div className="max-h-[45vh] space-y-3 overflow-y-auto py-4">
            {cart.lines.map((line) => {
              const item = CARTA_ITEMS_DEMO.find((i) => i.id === line.itemId);
              if (!item) return null;
              return (
                <div key={line.itemId} className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatPEN(item.priceSoles)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-full"
                      aria-label={`Quitar un ${item.name}`}
                      onClick={() => cart.setQuantity(line.itemId, line.quantity - 1)}
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
                      aria-label={`Agregar un ${item.name}`}
                      onClick={() => cart.setQuantity(line.itemId, line.quantity + 1)}
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
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-heading text-lg font-extrabold tabular-nums">
                {formatPEN(cart.totalSoles)}
              </span>
            </div>
            <Button className="w-full" size="lg" onClick={confirm}>
              Confirmar pedido demo
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Demo: sin pago en línea. La pasarela y la wallet llegan después del MVP.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
