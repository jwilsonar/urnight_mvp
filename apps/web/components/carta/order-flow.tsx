'use client';

import { ArrowLeft, MapPin } from '@phosphor-icons/react';
import { Badge, Button, Card, CardContent } from '@urnight/ui';
import { OrderStatusTimeline } from '@/components/carta/order-status-timeline';
import { Reveal } from '@/components/shared/reveal';

/**
 * Pantalla post-confirmación del pedido demo: código de recojo grande +
 * timeline de estado. El usuario muestra el código en la zona de recojo.
 */
export function OrderFlow({
  pickupCode,
  pickupZone,
  onReset,
}: {
  pickupCode: string;
  pickupZone: string;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <Reveal>
        <Card className="overflow-hidden text-center">
          <div className="un-hero-glow border-b bg-surface px-6 py-8">
            <p className="un-eyebrow mb-2">Tu código de recojo</p>
            <p className="font-display text-5xl font-extrabold tracking-widest text-lavender">
              {pickupCode}
            </p>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" weight="duotone" />
              {pickupZone}
            </p>
          </div>
          <CardContent className="p-6 text-left">
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
