import {
  ArrowUUpLeft,
  CalendarBlank,
  Info,
  Ticket,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import type { EventResponse } from "@urnight/contracts";
import { Badge, type BadgeProps, Card, CardContent, cn } from "@urnight/ui";
import { HoloCard, HoloFlipButton } from "@/components/motion/holo-card";
import { StorageImage } from "@/lib/storage/storage-context";

const STATUS_VARIANT: Record<EventResponse["status"], BadgeProps["variant"]> = {
  draft: "outline",
  scheduled: "secondary",
  published: "success",
  cancelled: "destructive",
  finished: "outline",
};

/** Pill CTA compartido entre las cards del catálogo (evento y local). */
export const CTA_CLASS =
  "inline-flex h-[34px] items-center justify-center rounded-sm bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground shadow-glow";

/** Botón redondo sobre flyer/reverso: mismo lenguaje que las badges (fondo sólido). */
export const ICON_BTN_CLASS =
  "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-accent-border bg-deep/90 text-rose outline-none backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring";

export function EventCard({ event }: { event: EventResponse }) {
  const t = useTranslations("events.card");
  const format = useFormatter();
  const formatTime = (value: string) =>
    format.dateTime(new Date(value), {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  const schedule = event.endsAt
    ? `${formatTime(event.startsAt)} – ${formatTime(event.endsAt)}`
    : formatTime(event.startsAt);
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
                <span>{t("flyerAlt")}</span>
              </div>
            )}
            {/* Sobre fotografía: fondo oscuro sólido para que el tono no se lave. */}
            <Badge
              variant={soldOut ? "destructive" : STATUS_VARIANT[event.status]}
              className="absolute left-2 top-2 bg-deep/90 backdrop-blur-sm"
            >
              {soldOut ? t("soldOut") : t(`status.${event.status}`)}
            </Badge>
            {/* Heat del prototipo, calculado con aforo real (ticketsSold/totalCapacity). */}
            {almostFull ? (
              <Badge
                variant="warning"
                className="absolute bottom-2 left-2 bg-deep/90 backdrop-blur-sm"
              >
                🔥 {t("almostFull")}
              </Badge>
            ) : null}
          </div>
          <CardContent className="flex flex-1 flex-col p-4">
            <p className="rv-eyebrow flex min-w-0 items-center gap-1.5 whitespace-nowrap">
              <CalendarBlank className="size-3.5 shrink-0" weight="duotone" />
              <span className="truncate">
                {format.dateTime(new Date(event.startsAt), {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                · {schedule}
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
                  ? t("noSpots")
                  : event.totalCapacity > 0
                    ? t("spots", {
                        count: Math.max(
                          event.totalCapacity - event.ticketsSold,
                          0,
                        ),
                      })
                    : t("spotsAvailable")}
              </span>
              <Link
                href={href}
                className={cn(
                  CTA_CLASS,
                  "outline-none transition-transform group-hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {t("viewEvent")}
              </Link>
            </div>
          </CardContent>
        </Card>
        <HoloFlipButton
          label={t("viewInformation")}
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
  const t = useTranslations("events.card");
  const format = useFormatter();
  const formatTime = (value: string) =>
    format.dateTime(new Date(value), {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  const schedule = event.endsAt
    ? `${formatTime(event.startsAt)} – ${formatTime(event.endsAt)}`
    : formatTime(event.startsAt);
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
          {t("detail")}
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
            {format.dateTime(new Date(event.startsAt), {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {schedule}
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
            <span className="text-muted-foreground">{t("capacity")}</span>
            <span className="font-semibold tabular-nums">
              {event.totalCapacity > 0
                ? `${event.ticketsSold} / ${event.totalCapacity}`
                : t("noCapacity")}
            </span>
          </div>
          {event.totalCapacity > 0 ? (
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={event.totalCapacity}
              aria-valuenow={event.ticketsSold}
              aria-label={t("ticketsSoldAria", {
                sold: event.ticketsSold,
                capacity: event.totalCapacity,
              })}
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
          <HoloFlipButton label={t("flipBack")} className={ICON_BTN_CLASS}>
            <ArrowUUpLeft className="size-4" weight="bold" />
          </HoloFlipButton>
          <Link
            href={href}
            className={cn(
              CTA_CLASS,
              "flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {t("viewEvent")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
