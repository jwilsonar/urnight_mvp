'use client';

import { Tray } from '@phosphor-icons/react';
import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@urnight/ui';
import { EmptyState } from '@/components/shared/empty-state';
import { formatPEN } from '@/lib/utils';
import {
  CARTA_ORDER_STATUS_LABEL,
  CARTA_PEDIDOS_DEMO,
  type CartaOrderDemo,
  type CartaOrderStatusDemo,
} from '@/lib/mock/carta';

const FLOW: CartaOrderStatusDemo[] = ['received', 'preparing', 'ready', 'delivered'];

const NEXT_ACTION: Partial<Record<CartaOrderStatusDemo, string>> = {
  received: 'Empezar preparación',
  preparing: 'Marcar listo',
  ready: 'Entregar',
};

const STATUS_VARIANT: Record<CartaOrderStatusDemo, 'warning' | 'info' | 'success' | 'secondary'> = {
  received: 'warning',
  preparing: 'info',
  ready: 'success',
  delivered: 'secondary',
};

/**
 * Cola demo de pedidos in-venue del local: cada acción avanza el estado en
 * memoria. Con backend real esto consume el módulo de pedidos (polling o
 * websocket) y las acciones son mutaciones vía lib/api/.
 */
export function PedidosBoard() {
  const [orders, setOrders] = useState<CartaOrderDemo[]>(CARTA_PEDIDOS_DEMO);

  const advance = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next = FLOW[FLOW.indexOf(o.status) + 1];
        return next ? { ...o, status: next } : o;
      }),
    );
  };

  const byStatus = (status: CartaOrderStatusDemo) => orders.filter((o) => o.status === status);

  return (
    <Tabs defaultValue="received">
      <TabsList className="mb-4 flex-wrap">
        {FLOW.map((status) => (
          <TabsTrigger key={status} value={status} className="gap-2">
            {CARTA_ORDER_STATUS_LABEL[status]}
            <span className="rounded-full bg-surface px-1.5 text-xs tabular-nums text-muted-foreground">
              {byStatus(status).length}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {FLOW.map((status) => (
        <TabsContent key={status} value={status}>
          {byStatus(status).length === 0 ? (
            <EmptyState
              compact
              icon={<Tray weight="duotone" />}
              title={`Sin pedidos en «${CARTA_ORDER_STATUS_LABEL[status]}»`}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {byStatus(status).map((order) => (
                <OrderCard key={order.id} order={order} onAdvance={() => advance(order.id)} />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function OrderCard({ order, onAdvance }: { order: CartaOrderDemo; onAdvance: () => void }) {
  const action = NEXT_ACTION[order.status];
  return (
    // key por estado remonta la card → entrada suave al cambiar de columna
    <Card className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-3 p-4 duration-300">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-lg font-bold tracking-wider text-lavender">
            {order.pickupCode}
          </p>
          <p className="text-sm font-semibold">{order.attendeeName}</p>
        </div>
        <div className="text-right">
          <Badge variant={STATUS_VARIANT[order.status]}>
            {CARTA_ORDER_STATUS_LABEL[order.status]}
          </Badge>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{order.placedAtLabel}</p>
        </div>
      </div>

      <ul className="space-y-1 text-sm text-muted-foreground">
        {order.items.map((item) => (
          <li key={item.itemId} className="flex justify-between gap-2">
            <span className="truncate">
              {item.quantity}× {item.name}
            </span>
            <span className="shrink-0 tabular-nums">
              {formatPEN(item.quantity * item.unitPriceSoles)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between border-t pt-3">
        <div>
          <p className="text-xs text-muted-foreground">{order.pickupZone}</p>
          <p className="font-heading font-extrabold tabular-nums">{formatPEN(order.totalSoles)}</p>
        </div>
        {action ? (
          <Button size="sm" onClick={onAdvance}>
            {action}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
