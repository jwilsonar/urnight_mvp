import type { Metadata } from 'next';
import { Badge } from '@urnight/ui';
import { PedidosBoard } from '@/components/admin/pedidos-board';

export const metadata: Metadata = {
  title: 'Pedidos in-venue',
  description: 'Cola de pedidos de la carta del local por estado.',
};

/*
 * Demo frontend-only (carta in-venue, idea Wilson). Con backend real esta
 * cola consume el módulo de pedidos y cada acción es una mutación vía
 * lib/api/; los pedidos entran desde la carta del asistente con entrada
 * validada.
 */

export default function AdminPedidosPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Pedidos in-venue</h1>
          <p className="text-muted-foreground">
            Pedidos de la carta de esta noche: prepáralos y márcalos listos para recoger.
          </p>
        </div>
        <Badge variant="info">Demo — llega con el backend de pedidos</Badge>
      </div>
      <PedidosBoard />
    </div>
  );
}
