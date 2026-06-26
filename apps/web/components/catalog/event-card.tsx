import { CalendarBlank } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import type { EventResponse } from '@urnight/contracts';
import { Badge, type BadgeProps, Card, CardContent } from '@urnight/ui';
import { StorageImage } from '@/lib/storage/storage-context';
import { formatDate } from '@/lib/utils';

const STATUS_LABEL: Record<EventResponse['status'], { label: string; variant: BadgeProps['variant'] }> = {
  draft: { label: 'Borrador', variant: 'outline' },
  scheduled: { label: 'Próximamente', variant: 'secondary' },
  published: { label: 'En venta', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  finished: { label: 'Finalizado', variant: 'outline' },
};

export function EventCard({ event }: { event: EventResponse }) {
  const status = STATUS_LABEL[event.status];
  const soldOut = event.totalCapacity > 0 && event.ticketsSold >= event.totalCapacity;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full overflow-hidden transition-colors group-hover:border-primary">
        <div className="relative aspect-video bg-muted">
          {event.flyerUrl ? (
            <StorageImage
              src={event.flyerUrl}
              alt={event.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <CalendarBlank className="h-10 w-10" weight="duotone" />
            </div>
          )}
          <Badge variant={soldOut ? 'destructive' : status.variant} className="absolute right-2 top-2">
            {soldOut ? 'Agotado' : status.label}
          </Badge>
        </div>
        <CardContent className="space-y-1 p-4">
          <p className="text-xs font-medium text-primary">{formatDate(event.startsAt)}</p>
          <h3 className="line-clamp-2 font-heading font-semibold leading-tight">{event.name}</h3>
          {event.minAgeNote ? <p className="text-xs text-muted-foreground">{event.minAgeNote}</p> : null}
        </CardContent>
      </Card>
    </Link>
  );
}
