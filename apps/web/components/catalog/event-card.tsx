import {
  ArrowUUpLeft,
  CalendarBlank,
  Info,
  Ticket,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { EventResponse } from "@urnight/contracts";
import { Badge, type BadgeProps, Card, CardContent, cn } from "@urnight/ui";
import { HoloCard, HoloFlipButton } from "@/components/motion/holo-card";
import { StorageImage } from "@/lib/storage/storage-context";

const STATUS_LABEL: Record<
  EventResponse["status"],
  { label: string; variant: BadgeProps["variant"] }
> = {
  draft: { label: "Borrador", variant: "outline" },
  scheduled: { label: "Próximamente", variant: "secondary" },
  published: { label: "En venta", variant: "success" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  finished: { label: "Finalizado", variant: "outline" },
};

/* Fecha corta estilo prototipo ("SÁB 19 ABR"); la hora va aparte en el rango. */
const DATE = new Intl.DateTimeFormat("es-PE", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const TIME = new Intl.DateTimeFormat("es-PE", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
/* En el reverso sí hay sitio para la fecha sin abreviar. */
const DATE_LONG = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function timeRange(startsAt: string, endsAt: string | null): string {
  const start = TIME.format(new Date(startsAt));
  return endsAt ? `${start} – ${TIME.format(new Date(endsAt))}` : start;
}

/** Pill CTA compartido entre las cards del catálogo (evento y local). */
export const CTA_CLASS =
  "inline-flex h-[34px] items-center justify-center rounded-sm bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground shadow-glow";

/** Botón redondo sobre flyer/reverso: mismo lenguaje que las badges (fondo sólido). */
export const ICON_BTN_CLASS =
  "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-accent-border bg-deep/90 text-rose outline-none backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring";

export function EventCard({ event }: { event: EventResponse }) {
  const status = STATUS_LABEL[event.status];
  const pct =
    event.totalCapacity > 0 ? event.ticketsSold / event.totalCapacity : 0;
  const soldOut =
    event.totalCapacity > 0 && event.ticketsSold >= event.totalCapacity;
  const almostFull = !soldOut && pct >= 0.8;
  const href = `/events/${event.slug}`;

  return (
    // trigger="slot": la navegación y el flip son controles independientes.
    <HoloCard
      className="h-full"
      trigger="slot"
      back={<EventCardBack event={event} href={href} />}
    >
      {/* `group` mantiene los estados visuales sin convertir toda la card en link. */}
      <div className="group relative h-full rounded-lg">
        <Card className="flex h-full flex-col overflow-hidden group-hover:border-accent-border group-hover:shadow-float">
          <div className="rv-zoom-img relative aspect-video overflow-hidden">
            {event.flyerUrl ? (
              <StorageImage
                src={event.flyerUrl}
                alt={event.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                // El zoom pasa a group-hover: el link va por encima del flyer, así
                // que `.rv-zoom-img:hover` ya no se dispara al pasar por la imagen.
                className="object-cover group-hover:scale-105"
              />
            ) : (
              <div className="rv-img-ph absolute inset-0">
                <span>Flyer del evento</span>
              </div>
            )}
            {/* Sobre fotografía: fondo oscuro sólido para que el tono no se lave. */}
            <Badge
              variant={soldOut ? "destructive" : status.variant}
              className="absolute left-2 top-2 bg-deep/90 backdrop-blur-sm"
            >
              {soldOut ? "Agotado" : status.label}
            </Badge>
            {/* Heat del prototipo, calculado con aforo real (ticketsSold/totalCapacity). */}
            {almostFull ? (
              <Badge
                variant="warning"
                className="absolute bottom-2 left-2 bg-deep/90 backdrop-blur-sm"
              >
                🔥 Casi lleno
              </Badge>
            ) : null}
          </div>
          <CardContent className="flex flex-1 flex-col p-4">
            <p className="rv-eyebrow flex min-w-0 items-center gap-1.5 whitespace-nowrap">
              <CalendarBlank className="size-3.5 shrink-0" weight="duotone" />
              <span className="truncate">
                {DATE.format(new Date(event.startsAt))} ·{" "}
                {timeRange(event.startsAt, event.endsAt)}
              </span>
            </p>
            <h3 className="mt-2 min-h-[2.5em] line-clamp-2 font-heading text-[17px] font-bold leading-tight">
              {event.name}
            </h3>
            {/* Pills a la altura del prototipo: +18 + tags del evento */}
            <div className="mb-3 mt-3 flex flex-wrap gap-1.5">
              {event.minAgeNote ? (
                <Badge variant="destructive">{event.minAgeNote}</Badge>
              ) : null}
              {event.customTags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="mt-auto flex items-center justify-between border-t pt-3.5">
              <span className="text-xs text-muted-foreground">
                {soldOut
                  ? "Sin cupos"
                  : event.totalCapacity > 0
                    ? `${Math.max(event.totalCapacity - event.ticketsSold, 0)} cupos`
                    : "Cupos disponibles"}
              </span>
              <Link
                href={href}
                className={cn(
                  CTA_CLASS,
                  "outline-none transition-transform group-hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                Ver evento
              </Link>
            </div>
          </CardContent>
        </Card>
        <HoloFlipButton
          label="Ver información"
          className={cn(ICON_BTN_CLASS, "absolute right-2 top-2 z-[5]")}
        >
          <Info className="size-4" weight="duotone" />
        </HoloFlipButton>
      </div>
    </HoloCard>
  );
}

/** Reverso del ticket: lo que no cabe delante (fecha completa, todas las etiquetas, aforo). */
function EventCardBack({
  event,
  href,
}: {
  event: EventResponse;
  href: string;
}) {
  const pct =
    event.totalCapacity > 0 ? event.ticketsSold / event.totalCapacity : 0;
  const soldOut =
    event.totalCapacity > 0 && event.ticketsSold >= event.totalCapacity;
  const almostFull = !soldOut && pct >= 0.8;
  const filled = Math.round(Math.min(pct, 1) * 100);

  return (
    <Card className="flex h-full flex-col overflow-hidden border-accent-border">
      <CardContent className="flex min-h-0 flex-1 flex-col p-4">
        <p className="rv-eyebrow flex items-center gap-1.5">
          <Ticket className="size-3.5" weight="duotone" />
          Detalle del evento
        </p>
        <h3 className="mt-2 line-clamp-2 font-heading text-[17px] font-bold leading-tight">
          {event.name}
        </h3>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <CalendarBlank
            className="mt-0.5 size-3.5 shrink-0"
            weight="duotone"
          />
          {/* es-PE devuelve el día en minúscula ("sábado, 19 de abril de 2026"). */}
          <span className="first-letter:uppercase">
            {DATE_LONG.format(new Date(event.startsAt))} ·{" "}
            {timeRange(event.startsAt, event.endsAt)}
          </span>
        </p>

        {/* Aquí sí van TODAS las etiquetas: delante solo caben 3, y esa es media
            razón de ser del reverso. Scrollea si el evento trae muchas. */}
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-wrap gap-1.5">
            {event.minAgeNote ? (
              <Badge variant="destructive">{event.minAgeNote}</Badge>
            ) : null}
            {event.customTags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Aforo</span>
            <span className="font-semibold tabular-nums">
              {event.totalCapacity > 0
                ? `${event.ticketsSold} / ${event.totalCapacity}`
                : "Sin aforo definido"}
            </span>
          </div>
          {event.totalCapacity > 0 ? (
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={event.totalCapacity}
              aria-valuenow={event.ticketsSold}
              aria-label={`Entradas vendidas: ${event.ticketsSold} de ${event.totalCapacity}`}
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-elevated"
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  soldOut
                    ? "bg-error"
                    : almostFull
                      ? "bg-warning"
                      : "bg-primary",
                )}
                style={{ width: `${filled}%` }}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t pt-3.5">
          <HoloFlipButton
            label="Volver al frente del ticket"
            className={ICON_BTN_CLASS}
          >
            <ArrowUUpLeft className="size-4" weight="bold" />
          </HoloFlipButton>
          <Link
            href={href}
            className={cn(
              CTA_CLASS,
              "flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            Ver evento
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
