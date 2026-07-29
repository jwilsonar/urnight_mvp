import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import type { EventResponse } from "@urnight/contracts";
import { Badge, type BadgeProps, Card, CardContent } from "@urnight/ui";
import { StorageImage } from "@/lib/storage/storage-context";

const STATUS_VARIANT: Record<EventResponse["status"], BadgeProps["variant"]> = {
  draft: "outline",
  scheduled: "secondary",
  published: "success",
  cancelled: "destructive",
  finished: "outline",
};

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
    <div className="group relative h-full rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <Card className="relative flex h-full cursor-pointer flex-col overflow-hidden group-hover:border-accent-border group-hover:shadow-float group-focus-within:border-accent-border group-focus-within:shadow-float">
        <span
          aria-hidden
          className="rv-catalog-card-hover pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 ease-[var(--ease-brand)] group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
        />
        <div className="rv-zoom-img relative aspect-video overflow-hidden">
          {event.flyerUrl ? (
            <StorageImage
              src={event.flyerUrl}
              alt={event.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:z-10 after:content-['']"
            >
              {event.name}
            </Link>
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
          <div className="mt-auto border-t pt-3.5">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
