'use client';

import { ArrowLeft, MapPin } from '@phosphor-icons/react';
import { Badge, Button, Card, CardContent, Separator } from '@urnight/ui';
import { useCart } from '@/components/carta/cart-provider';
import { OrderStatusTimeline } from '@/components/carta/order-status-timeline';
import { Reveal } from '@/components/shared/reveal';
import { formatPEN } from '@/lib/utils';

/**
 * Revisión final y pantalla post-confirmación del pedido demo: aplica el
 * crédito, muestra el código de recojo y el timeline de estado.
 */
export function OrderFlow({
  pickupCode,
  pickupZone,
  creditoCanjeado,
  onConfirm,
  onReset,
}: {
  pickupCode: string | null;
  pickupZone: string;
  creditoCanjeado: number;
  onConfirm: (creditoCanjeado: number) => void;
  onReset: () => void;
}) {
  const cart = useCart();

  if (!pickupCode) {
    const creditoAplicable = Math.min(cart.creditoDisponible, cart.totalSoles);

    return (
      <div className="mx-auto max-w-md space-y-4">
        <Reveal>
          <Card>
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="rv-eyebrow mb-2">Confirma tu pedido</p>
                <h2 className="font-heading text-2xl font-extrabold">Resumen final</h2>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4 shrink-0" weight="duotone" />
                  Recoges en: {pickupZone}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Total del pedido</span>
                  <span className="font-semibold tabular-nums">{formatPEN(cart.totalSoles)}</span>
                </div>
                {creditoAplicable > 0 ? (
                  <div className="flex items-center justify-between gap-4 text-success">
                    <span className="font-semibold">Crédito de consumo</span>
                    <span className="font-semibold tabular-nums">
                      - {formatPEN(creditoAplicable)}
                    </span>
                  </div>
                ) : null}
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span className="font-heading font-bold">Total a pagar</span>
                  <span className="font-heading text-xl font-extrabold tabular-nums">
                    {formatPEN(cart.totalTrasCredito)}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={() => onConfirm(cart.canjearCredito())}
              >
                Confirmar pedido
              </Button>
            </CardContent>
          </Card>
        </Reveal>

        <Button variant="ghost" className="w-full" onClick={onReset}>
          <ArrowLeft className="size-4" /> Volver a la carta
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Reveal>
        <Card className="overflow-hidden text-center">
          <div className="rv-hero-glow border-b bg-surface px-6 py-8">
            <p className="rv-eyebrow mb-2">Tu código de recojo</p>
            <p className="font-display text-5xl font-extrabold tracking-widest text-rose">
              {pickupCode}
            </p>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" weight="duotone" />
              {pickupZone}
            </p>
          </div>
          <CardContent className="space-y-5 p-6 text-left">
            {creditoCanjeado > 0 ? (
              <div className="rounded-md border border-success-border bg-success-soft p-3 text-sm">
                <p className="font-semibold text-success">
                  Se canjearon {formatPEN(creditoCanjeado)} de tu crédito
                </p>
                {cart.creditoDisponible > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saldo restante: {formatPEN(cart.creditoDisponible)}
                  </p>
                ) : null}
              </div>
            ) : null}
            <OrderStatusTimeline />
          </CardContent>
        </Card>
      </Reveal>

      <Reveal delay={80}>
        <div className="space-y-3">
          <Button variant="secondary" className="w-full" onClick={onReset}>
            <ArrowLeft className="size-4" /> Pedir algo más
          </Button>
          <div className="text-center">
            <Badge variant="info">Demo — el pedido se paga al recoger</Badge>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
