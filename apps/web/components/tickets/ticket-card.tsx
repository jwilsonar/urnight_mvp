import { CalendarBlank, MapPin, User } from '@phosphor-icons/react/dist/ssr';
import type { TicketResponse } from '@urnight/contracts';
import { Badge, type BadgeProps, Card, CardContent } from '@urnight/ui';
import { TicketQr } from '@/components/tickets/ticket-qr';
import { formatDate } from '@/lib/utils';

const STATUS: Record<TicketResponse['status'], { label: string; variant: BadgeProps['variant'] }> = {
  valid: { label: 'Válida', variant: 'success' },
  used: { label: 'Usada', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
  expired: { label: 'Vencida', variant: 'outline' },
};

/**
 * Entrada con QR escaneable, detalle del evento (nombre, fecha, local, tipo),
 * asistente y estado. Reutilizada en checkout (éxito) y billetera. El detalle del
 * evento solo viene poblado en la billetera; en checkout va null y se omite.
 */
export function TicketCard({ ticket }: { ticket: TicketResponse }) {
  const status = STATUS[ticket.status];
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch">
        <TicketQr qrImageKey={ticket.qrImageKey} qrCode={ticket.qrCode} />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 font-heading text-lg font-bold leading-tight">
              {ticket.eventName ?? 'Tu entrada'}
            </h3>
            <Badge variant={status.variant} className="shrink-0">
              {status.label}
            </Badge>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            {ticket.eventStartsAt ? (
              <p className="flex items-center gap-1.5">
                <CalendarBlank className="h-4 w-4 shrink-0" weight="duotone" />
                <span className="capitalize">{formatDate(ticket.eventStartsAt)}</span>
              </p>
            ) : null}
            {ticket.venueName ? (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" weight="duotone" />
                <span className="truncate">{ticket.venueName}</span>
              </p>
            ) : null}
            <p className="flex items-center gap-1.5">
              <User className="h-4 w-4 shrink-0" weight="duotone" />
              <span className="truncate">{ticket.attendeeName}</span>
            </p>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            {ticket.ticketTypeName ? (
              <Badge variant="secondary">{ticket.ticketTypeName}</Badge>
            ) : null}
            <span className="text-xs text-muted-foreground">
              Emitida {formatDate(ticket.issuedAt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
