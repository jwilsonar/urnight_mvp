import { CalendarBlank } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import type { EventResponse } from '@urnight/contracts';
import { Badge, type BadgeProps, Card, CardContent } from '@urnight/ui';
import { Tilt } from '@/components/motion/tilt';
import { StorageImage } from '@/lib/storage/storage-context';

const STATUS_LABEL: Record<EventResponse['status'], { label: string; variant: BadgeProps['variant'] }> = {
  draft: { label: 'Borrador', variant: 'outline' },
  scheduled: { label: 'Próximamente', variant: 'secondary' },
  published: { label: 'En venta', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  finished: { label: 'Finalizado', variant: 'outline' },
};

/* Fecha corta estilo prototipo ("SÁB 19 ABR"); la hora va aparte en el rango. */
const DATE = new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
const TIME = new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });

function timeRange(startsAt: string, endsAt: string | null): string {
  const start = TIME.format(new Date(startsAt));
  return endsAt ? `${start} – ${TIME.format(new Date(endsAt))}` : start;
}

export function EventCard({ event }: { event: EventResponse }) {
  const status = STATUS_LABEL[event.status];
  const pct = event.totalCapacity > 0 ? event.ticketsSold / event.totalCapacity : 0;
  const soldOut = event.totalCapacity > 0 && event.ticketsSold >= event.totalCapacity;
  const almostFull = !soldOut && pct >= 0.8;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Card clickeable con tilt 3D siguiendo el puntero + borde/sombra al hover. */}
      <Tilt className="h-full rounded-lg">
      <Card className="flex h-full flex-col overflow-hidden group-hover:border-accent-border group-hover:shadow-float">
        <div className="un-zoom-img relative aspect-video overflow-hidden">
          {event.flyerUrl ? (
            <StorageImage
              src={event.flyerUrl}
              alt={event.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="un-img-ph absolute inset-0">
              <span>Flyer del evento</span>
            </div>
          )}
          <Badge variant={soldOut ? 'destructive' : status.variant} className="absolute right-2 top-2">
            {soldOut ? 'Agotado' : status.label}
          </Badge>
          {/* Heat del prototipo, calculado con aforo real (ticketsSold/totalCapacity). */}
          {almostFull ? (
            <Badge variant="warning" className="absolute bottom-2 left-2">
              🔥 Casi lleno
            </Badge>
          ) : null}
        </div>
        <CardContent className="flex flex-1 flex-col p-4">
          <p className="un-eyebrow flex items-center gap-1.5">
            <CalendarBlank className="size-3.5" weight="duotone" />
            {DATE.format(new Date(event.startsAt))} · {timeRange(event.startsAt, event.endsAt)}
          </p>
          <h3 className="mt-2 line-clamp-2 font-heading text-[17px] font-bold leading-tight">
            {event.name}
          </h3>
          {/* Pills a la altura del prototipo: +18 + tags del evento */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {event.minAgeNote ? <Badge variant="destructive">{event.minAgeNote}</Badge> : null}
            {event.customTags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="mt-auto flex items-center justify-between border-t pt-3.5">
            <span className="text-xs text-muted-foreground">
              {soldOut
                ? 'Sin cupos'
                : event.totalCapacity > 0
                  ? `${Math.max(event.totalCapacity - event.ticketsSold, 0)} cupos`
                  : 'Cupos disponibles'}
            </span>
            <span className="inline-flex h-[34px] items-center rounded-sm bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground shadow-glow transition-transform group-hover:scale-[1.03]">
              Ver evento
            </span>
          </div>
        </CardContent>
      </Card>
      </Tilt>
    </Link>
  );
}
