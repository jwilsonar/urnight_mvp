'use client';

import { Minus, Plus } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@urnight/ui';
import { useCart } from '@/components/carta/cart-provider';
import { StorageImage } from '@/lib/storage/storage-context';
import { formatPEN } from '@/lib/utils';
import { CARTA_TAG_LABEL, type CartaItemDemo } from '@/lib/mock/carta';

/** Detalle de producto en Sheet (in-venue friendly: se abre sin salir de la carta). */
export function ProductSheet({
  item,
  open,
  onOpenChange,
}: {
  item: CartaItemDemo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);

  // Reinicia la cantidad al abrir otro producto.
  useEffect(() => {
    if (open) setQuantity(1);
  }, [open, item?.id]);

  if (!item) return null;

  const addAndClose = () => {
    cart.add(item.id, quantity);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl border-t p-0 sm:rounded-t-2xl">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
          <StorageImage
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 512px"
            className="object-cover"
          />
        </div>
        <div className="space-y-4 p-5">
          <SheetHeader className="space-y-2 text-left">
            <div className="flex flex-wrap items-center gap-2">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="info">
                  {CARTA_TAG_LABEL[tag]}
                </Badge>
              ))}
            </div>
            <SheetTitle className="font-heading text-xl font-extrabold">{item.name}</SheetTitle>
            <SheetDescription className="text-sm leading-relaxed">
              {item.description}
            </SheetDescription>
          </SheetHeader>

          <div className="flex items-center justify-between gap-4">
            {/* Stepper de cantidad */}
            <div className="flex items-center gap-3 rounded-full border bg-surface px-2 py-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                aria-label="Quitar uno"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-4" weight="bold" />
              </Button>
              <span className="min-w-6 text-center font-heading text-base font-bold tabular-nums">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                aria-label="Agregar uno"
                disabled={quantity >= 20}
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              >
                <Plus className="size-4" weight="bold" />
              </Button>
            </div>

            <Button className="flex-1" disabled={!item.available} onClick={addAndClose}>
              {item.available
                ? `Agregar · ${formatPEN(item.priceSoles * quantity)}`
                : 'Agotado esta noche'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
