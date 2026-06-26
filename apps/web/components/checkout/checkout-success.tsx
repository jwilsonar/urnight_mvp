'use client';

import Link from 'next/link';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from '@urnight/ui';
import { TicketCard } from '@/components/tickets/ticket-card';
import type { CheckoutResult } from '@/lib/api/orders';
import { formatPEN } from '@/lib/utils';

/** Vista de confirmación tras un checkout exitoso (orden + entradas emitidas). */
export function CheckoutSuccess({ result }: { result: CheckoutResult }) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          ¡Pago confirmado! Tu orden <strong>{result.order.orderCode}</strong> está lista.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row label="Subtotal" value={formatPEN(result.order.subtotal)} />
          {result.order.discountTotal > 0 ? (
            <Row label="Descuento" value={`- ${formatPEN(result.order.discountTotal)}`} />
          ) : null}
          <Separator className="my-2" />
          <Row label="Total" value={formatPEN(result.order.total)} strong />
        </CardContent>
      </Card>
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Tus entradas</h2>
        {result.tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
      <Button asChild className="w-full">
        <Link href="/account/tickets">Ver mis entradas</Link>
      </Button>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between ${strong ? 'text-base font-semibold' : 'text-muted-foreground'}`}
    >
      <span>{label}</span>
      <span className={strong ? 'text-foreground' : undefined}>{value}</span>
    </div>
  );
}
