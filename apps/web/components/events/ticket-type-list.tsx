import { Ticket } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import type { TicketTypeResponse } from '@urnight/contracts';
import { Badge, Button, Card, CardContent } from '@urnight/ui';
import { tierLabel } from '@/components/admin/status-badges';
import { EmptyState } from '@/components/shared/empty-state';
import { formatPEN } from '@/lib/utils';

/** Lista de tipos de entrada. Regla: no se muestra precio sin stock disponible. */
export function TicketTypeList({
  ticketTypes,
  eventSlug,
  canBuy,
}: {
  ticketTypes: TicketTypeResponse[];
  eventSlug: string;
  canBuy: boolean;
}) {
  if (ticketTypes.length === 0) {
    return (
      <EmptyState
        compact
        icon={<Ticket weight="duotone" />}
        title="Aún no hay entradas a la venta"
        description="Vuelve pronto para conseguir la tuya."
      />
    );
  }

  return (
    <div className="space-y-3">
      {ticketTypes.map((tt) => {
        const soldOut = tt.status === 'sold_out' || tt.remaining <= 0;
        return (
          <Card key={tt.id}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tt.name}</span>
                  <Badge variant="outline">{tierLabel(tt.tierCode)}</Badge>
                </div>
                {soldOut ? (
                  <span className="text-sm text-destructive">Agotado</span>
                ) : (
                  <span className="text-sm font-semibold text-foreground">{formatPEN(tt.price)}</span>
                )}
              </div>
              {!soldOut && canBuy ? (
                <span className="text-xs text-muted-foreground">{tt.remaining} disponibles</span>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {canBuy ? (
        <Button asChild className="w-full" size="lg">
          <Link href={`/checkout?event=${eventSlug}`}>
            <Ticket className="h-4 w-4" /> Comprar entradas
          </Link>
        </Button>
      ) : (
        <p className="text-center text-sm text-muted-foreground">Las entradas no están disponibles por ahora.</p>
      )}
    </div>
  );
}
