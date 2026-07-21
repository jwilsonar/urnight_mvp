import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { EventResponse } from "@urnight/contracts";
import { Button } from "@urnight/ui";
import { EventCard } from "@/components/catalog/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import { getUpcomingEvents } from "@/lib/api/catalog";

export const revalidate = 60;
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("events.calendar");
  return { title: t("metadataTitle") };
}

export default async function EventsCalendarPage() {
  const [t, format] = await Promise.all([
    getTranslations("events.calendar"),
    getFormatter(),
  ]);
  const events = await getUpcomingEvents().catch(() => []);
  const groups = new Map<string, EventResponse[]>();
  for (const event of events) {
    const key = format.dateTime(new Date(event.startsAt), {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const bucket = groups.get(key) ?? [];
    bucket.push(event);
    groups.set(key, bucket);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/events">{t("viewList")} →</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarBlank className="h-10 w-10" weight="duotone" />}
          title={t("empty.title")}
          description={t("empty.description")}
        />
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([day, dayEvents]) => (
            <section key={day}>
              <h2 className="mb-3 font-heading text-lg font-semibold capitalize">
                {day}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
