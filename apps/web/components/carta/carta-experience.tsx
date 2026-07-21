"use client";

import { Wallet } from "@phosphor-icons/react";
import { Card } from "@urnight/ui";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CartProvider, useCart } from "@/components/carta/cart-provider";
import { CartaBrowser } from "@/components/carta/carta-browser";
import { CartFab } from "@/components/carta/cart-fab";
import { OrderFlow } from "@/components/carta/order-flow";

/**
 * Orquesta la experiencia in-venue: navegar la carta → confirmar pedido demo →
 * pantalla de recojo con código. Con backend real, confirmar crea el pedido
 * vía lib/api/ y el estado llega del módulo de pedidos.
 */
export function CartaExperience({
  localSlug,
  pickupZone,
}: {
  localSlug: string;
  pickupZone: string;
}) {
  return (
    <CartProvider localSlug={localSlug}>
      <CartaFlow pickupZone={pickupZone} />
    </CartProvider>
  );
}

function CartaFlow({ pickupZone }: { pickupZone: string }) {
  const t = useTranslations("carta.credit");
  const format = useFormatter();
  const cart = useCart();
  const [reviewingOrder, setReviewingOrder] = useState(false);
  const [pickupCode, setPickupCode] = useState<string | null>(null);
  const [creditoCanjeado, setCreditoCanjeado] = useState(0);

  const confirmOrder = (descontado: number) => {
    setCreditoCanjeado(descontado);
    // Código demo estilo UN-###; en backend lo emite el módulo de pedidos.
    setPickupCode(`UN-${Math.floor(100 + Math.random() * 900)}`);
    cart.clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (reviewingOrder || pickupCode) {
    return (
      <OrderFlow
        pickupCode={pickupCode}
        pickupZone={pickupZone}
        creditoCanjeado={creditoCanjeado}
        onConfirm={confirmOrder}
        onReset={() => {
          setReviewingOrder(false);
          setPickupCode(null);
          setCreditoCanjeado(0);
        }}
      />
    );
  }

  return (
    <>
      {cart.creditoDisponible > 0 ? (
        <Card className="mb-5 flex items-start gap-3 border-success-border bg-success-soft p-4">
          <Wallet
            className="mt-0.5 size-5 shrink-0 text-success"
            weight="duotone"
          />
          <div>
            <p className="text-sm font-semibold text-success">
              {t("creditAvailable", {
                amount: format.number(cart.creditoDisponible, {
                  style: "currency",
                  currency: "PEN",
                }),
              })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("creditNote")}
            </p>
          </div>
        </Card>
      ) : null}
      <CartaBrowser />
      <CartFab
        pickupZone={pickupZone}
        onConfirm={() => setReviewingOrder(true)}
      />
      {/* Espacio para que el FAB no tape el final del grid */}
      {cart.count > 0 ? <div aria-hidden className="h-20" /> : null}
    </>
  );
}
