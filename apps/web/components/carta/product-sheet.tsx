"use client";

import {
  ArrowClockwise,
  ForkKnife,
  Lock,
  Minus,
  Plus,
  Warning,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { MenuProductResponse } from "@urnight/contracts";
import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  Badge,
  Button,
  Skeleton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@urnight/ui";
import { useCart } from "@/components/carta/cart-provider";
import { getErrorMessage } from "@/lib/api/error-messages";
import { getMenuProduct } from "@/lib/api/menu";
import { queryKeys } from "@/lib/api/query-keys";
import { StorageImage } from "@/lib/storage/storage-context";

/** Detalle de producto en Sheet (in-venue friendly: se abre sin salir de la carta). */
export function ProductSheet({
  localId,
  item,
  open,
  onOpenChange,
}: {
  localId: string;
  item: MenuProductResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const productT = useTranslations("carta.product");
  const errorT = useTranslations("auth.errors");
  const format = useFormatter();
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const detailQuery = useQuery({
    queryKey: queryKeys.menuProduct(localId, item?.id ?? ""),
    queryFn: ({ signal }) => getMenuProduct(localId, item!.id, signal),
    enabled: open && item !== null,
    staleTime: 30_000,
  });
  const product = detailQuery.data ?? item;

  // Reinicia al abrir otro producto: 1 si se puede pedir, 0 si está agotado
  // (no tiene sentido arrancar en 1 algo que no se puede agregar).
  useEffect(() => {
    if (open) setQuantity(product?.isAvailable ? 1 : 0);
  }, [open, product?.id, product?.isAvailable]);

  if (!item || !product) return null;

  const addAndClose = () => {
    cart.add(product.id, quantity);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg rounded-t-2xl border-t p-0 sm:rounded-t-2xl"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
          {product.imageUrl ? (
            <StorageImage
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
              <ForkKnife aria-hidden="true" className="size-12" weight="duotone" />
            </div>
          )}
        </div>
        <div className="space-y-4 p-5">
          <SheetHeader className="space-y-2 text-left">
            <div className="flex flex-wrap items-center gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="info">
                  {tag}
                </Badge>
              ))}
            </div>
            <SheetTitle className="font-heading text-xl font-extrabold">
              {product.name}
            </SheetTitle>
            <SheetDescription className="text-sm leading-relaxed">
              {product.description ?? productT("noDescription")}
            </SheetDescription>
          </SheetHeader>

          {detailQuery.isPending ? (
            <div
              className="space-y-2"
              role="status"
              aria-label={productT("loading")}
            >
              <Skeleton className="h-4 w-3/4 motion-reduce:animate-none" />
              <Skeleton className="h-4 w-1/2 motion-reduce:animate-none" />
            </div>
          ) : null}

          {detailQuery.isError ? (
            <div
              className="rounded-md border border-destructive/40 bg-destructive/10 p-3"
              role="alert"
            >
              <div className="flex items-start gap-2 text-sm text-destructive">
                <Warning className="mt-0.5 size-4 shrink-0" weight="duotone" />
                <p>
                  {getErrorMessage(detailQuery.error, (key) => errorT(key))}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => void detailQuery.refetch()}
              >
                <ArrowClockwise className="size-4" /> {productT("retry")}
              </Button>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            {product.isAvailable ? (
              /* Stepper de cantidad */
              <div className="flex items-center gap-3 rounded-full border bg-surface px-2 py-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  aria-label={productT("removeOne")}
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
                  aria-label={productT("addOne")}
                  disabled={quantity >= 20}
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                >
                  <Plus className="size-4" weight="bold" />
                </Button>
              </div>
            ) : (
              /* Agotado: contador fijo en 0 y bloqueado. El candado deja claro
                 que no hay nada que ajustar — mismo lenguaje que las mesas
                 reservadas del wizard de reserva. */
              <div className="flex items-center gap-2 rounded-full border bg-surface px-4 py-2 text-muted-foreground">
                <Lock className="size-4" weight="fill" />
                <span className="min-w-6 text-center font-heading text-base font-bold tabular-nums">
                  0
                </span>
              </div>
            )}

            <Button
              className="flex-1"
              disabled={
                !product.isAvailable || detailQuery.isPending || detailQuery.isError
              }
              onClick={addAndClose}
            >
              {product.isAvailable
                ? productT("addWithPrice", {
                    amount: format.number(product.priceAmount * quantity, {
                      style: "currency",
                      currency: product.priceCurrency,
                    }),
                  })
                : productT("soldOutTonight")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
