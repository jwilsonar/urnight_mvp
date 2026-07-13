'use client';

import { useState } from 'react';
import { CartProvider, useCart } from '@/components/carta/cart-provider';
import { CartaBrowser } from '@/components/carta/carta-browser';
import { CartFab } from '@/components/carta/cart-fab';
import { OrderFlow } from '@/components/carta/order-flow';

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
  const cart = useCart();
  const [pickupCode, setPickupCode] = useState<string | null>(null);

  const confirmOrder = () => {
    // Código demo estilo UN-###; en backend lo emite el módulo de pedidos.
    setPickupCode(`UN-${Math.floor(100 + Math.random() * 900)}`);
    cart.clear();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (pickupCode) {
    return <OrderFlow pickupCode={pickupCode} pickupZone={pickupZone} onReset={() => setPickupCode(null)} />;
  }

  return (
    <>
      <CartaBrowser />
      <CartFab pickupZone={pickupZone} onConfirm={confirmOrder} />
      {/* Espacio para que el FAB no tape el final del grid */}
      {cart.count > 0 ? <div aria-hidden className="h-20" /> : null}
    </>
  );
}
