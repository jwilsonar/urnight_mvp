import { MapPin } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { EventResponse, LocalResponse } from "@urnight/contracts";
import { Card, CardContent } from "@urnight/ui";
import { EventStatusPill } from "@/components/catalog/event-status-pill";
import { StorageImage } from "@/lib/storage/storage-context";

export function EventCard({
  event,
  local,
  priceFrom,
}: {
  event: EventResponse;
  local?: Pick<LocalResponse, "name" | "address"> | null;
  priceFrom?: number | null;
}) {
  const t = useTranslations("events.card");
  const format = useFormatter();
  const locale = useLocale();
  const startsAt = new Date(event.startsAt);
  const zone = local?.address?.split(",").at(-1)?.trim();
  const href = `/events/${event.slug}`;
  const weekday = format.dateTime(startsAt, { weekday: "long" });
  const weekdayLabel =
    weekday.charAt(0).toLocaleUpperCase(locale) + weekday.slice(1);

  return (
    <div className="group relative h-full rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <Card className="relative flex h-full cursor-pointer flex-col overflow-hidden transition-colors duration-300 group-hover:border-accent-border group-focus-within:border-accent-border motion-reduce:transition-none">
        <span
          aria-hidden="true"
          className="rv-catalog-card-hover pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 ease-[var(--ease-brand)] group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
        />

        <div className="rv-zoom-img relative aspect-[4/3] overflow-visible">
          <div className="absolute inset-0 overflow-hidden">
            {event.flyerUrl ? (
              <StorageImage
                src={event.flyerUrl}
                alt={t("flyerAltNamed", { name: event.name })}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105"
              />
            ) : (
              <div className="rv-img-ph absolute inset-0">
                <span>{t("flyerAlt")}</span>
              </div>
            )}
          </div>

          {event.catalogLabel ? (
            <EventStatusPill
              status={event.catalogLabel}
              className="absolute right-3 top-3 z-10 bg-card/90 backdrop-blur-sm"
            />
          ) : null}

          <time
            dateTime={event.startsAt}
            className="absolute bottom-0 left-4 z-10 grid min-w-14 translate-y-1/2 place-items-center rounded-md border border-accent-border bg-card px-2.5 py-1.5 text-center"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">
              {format.dateTime(startsAt, { month: "short" })}
            </span>
            <span className="font-heading text-xl font-black leading-none">
              {format.dateTime(startsAt, { day: "2-digit" })}
            </span>
          </time>
        </div>

        <CardContent className="z-[2] flex flex-1 flex-col px-4 pb-0 pt-10">
          <h3 className="min-h-[2.5em] line-clamp-2 font-heading text-lg font-extrabold leading-tight tracking-tight">
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:z-20 after:content-['']"
            >
              {event.name}
            </Link>
          </h3>

          <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" weight="duotone" />
            <span className="truncate">
              {local?.name ?? t("venueFallback")}
            </span>
            {zone ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{zone}</span>
              </>
            ) : null}
          </p>

          <dl className="mt-5 grid grid-cols-2 divide-x border-t">
            <div className="min-w-0 py-3 pr-3">
              <dt className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {t("priceLabel")}
              </dt>
              <dd className="mt-1 truncate text-sm font-black tabular-nums">
                {priceFrom === null || priceFrom === undefined
                  ? t("priceUnavailable")
                  : format.number(priceFrom, {
                      style: "currency",
                      currency: "PEN",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
              </dd>
            </div>
            <div className="min-w-0 py-3 pl-3">
              <dt className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {t("dateLabel")}
              </dt>
              <dd className="mt-1 truncate text-sm font-black">
                {weekdayLabel}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
