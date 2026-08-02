"use client";

import { ArrowLeft, ArrowRight, CalendarBlank } from "@phosphor-icons/react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState, type KeyboardEvent } from "react";
import { m, useReducedMotion } from "framer-motion";
import type { EventResponse } from "@urnight/contracts";
import { cn } from "@urnight/ui";
import { StorageImage } from "@/lib/storage/storage-context";

const MAX_VISIBLE_OFFSET = 2;
const AUTOPLAY_DELAY_MS = 3_000;
const MANUAL_RESUME_DELAY_MS = 6_000;
const CAROUSEL_EDGE_MASK =
  "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)";

function relativePosition(index: number, active: number, total: number) {
  const forward = (index - active + total) % total;
  if (forward === 0) return 0;
  return forward <= Math.floor(total / 2) ? forward : forward - total;
}

export function WeekEventCarousel({ events }: { events: EventResponse[] }) {
  const t = useTranslations("home.hero.carousel");
  const format = useFormatter();
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [manualPause, setManualPause] = useState(false);
  const expanded = hovered || focusWithin;
  const paused = expanded || !documentVisible;

  useEffect(() => {
    const updateVisibility = () => {
      setDocumentVisible(document.visibilityState === "visible");
    };
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (reducedMotion || paused || events.length < 2) return;
    const timer = window.setTimeout(
      () => {
        setActiveIndex((current) => (current + 1) % events.length);
        setManualPause(false);
      },
      manualPause ? MANUAL_RESUME_DELAY_MS : AUTOPLAY_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [activeIndex, events.length, manualPause, paused, reducedMotion]);

  if (events.length === 0) {
    return (
      <div
        className="flex h-[clamp(13rem,34svh,22rem)] items-center justify-center rounded-xl border border-accent-border bg-surface/70 p-6 text-center"
        role="status"
      >
        <div className="max-w-sm">
          <CalendarBlank
            className="mx-auto size-9 text-primary"
            weight="duotone"
          />
          <h2 className="mt-3 font-heading text-lg font-extrabold">
            {t("emptyTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("emptyDescription")}
          </p>
        </div>
      </div>
    );
  }

  const activeEvent = events[activeIndex] ?? events[0]!;
  const select = (index: number, manual = false) => {
    setActiveIndex((index + events.length) % events.length);
    if (manual) setManualPause(true);
  };
  const previous = () => select(activeIndex - 1, true);
  const next = () => select(activeIndex + 1, true);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0, true);
    } else if (event.key === "End") {
      event.preventDefault();
      select(events.length - 1, true);
    }
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={t("label")}
      aria-describedby="week-carousel-instructions"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusWithin(false);
        }
      }}
      className="relative h-[clamp(15rem,42svh,26rem)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <p id="week-carousel-instructions" className="sr-only">
        {t("instructions")}
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {t("activeAnnouncement", {
          current: activeIndex + 1,
          total: events.length,
          name: activeEvent.name,
        })}
      </p>

      <div
        data-carousel-viewport
        className="absolute inset-x-0 bottom-16 top-0 overflow-hidden"
        style={{
          maskImage: CAROUSEL_EDGE_MASK,
          WebkitMaskImage: CAROUSEL_EDGE_MASK,
        }}
      >
        {events.map((event, index) => {
          const position = relativePosition(index, activeIndex, events.length);
          const visible = Math.abs(position) <= MAX_VISIBLE_OFFSET;
          const active = position === 0;
          const spread = expanded ? 72 : 58;

          return (
            <div
              key={event.id}
              aria-hidden={!visible}
              className="pointer-events-none absolute inset-0 grid place-items-center"
            >
              <m.div
                initial={
                  reducedMotion
                    ? false
                    : {
                        opacity: 0,
                        y: 54,
                        rotate: position * 13,
                        scale: 0.78,
                      }
                }
                animate={{
                  opacity: visible ? (active ? 1 : 0.76) : 0,
                  x: `${position * spread}%`,
                  y: active ? 0 : Math.abs(position) * 18 + 8,
                  // El abanico es parte del diseño. La rotación vive en el
                  // elemento transformado, nunca en el que recorta, para que el
                  // radio de la card no se rompa. Al medir la forma usar
                  // offsetWidth/offsetHeight: el getBoundingClientRect de un
                  // elemento rotado siempre sale más ancho y engaña.
                  rotate: position * (expanded ? 10 : 8),
                  scale: active ? 1 : 0.86 - Math.abs(position) * 0.04,
                }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: 175,
                        damping: 17,
                        mass: 0.65,
                      }
                }
                style={{ zIndex: MAX_VISIBLE_OFFSET - Math.abs(position) + 1 }}
                className={cn(
                  "pointer-events-auto relative aspect-[3/4] w-[clamp(9.5rem,29vw,14rem)]",
                  !visible && "pointer-events-none",
                )}
              >
                <div
                  data-carousel-card
                  data-active={active}
                  data-position={position}
                  className="absolute inset-0 isolate overflow-hidden rounded-xl border border-border bg-card shadow-overlay"
                >
                  <Link
                    href={`/events/${event.slug}`}
                    tabIndex={visible ? 0 : -1}
                    aria-label={t("openEvent", { name: event.name })}
                    onFocus={() => select(index, true)}
                    className="group absolute inset-0 overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                  >
                    {event.flyerUrl ? (
                      <StorageImage
                        src={event.flyerUrl}
                        alt={t("flyerAlt", { name: event.name })}
                        fill
                        priority={activeIndex === 0 && index === 0}
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 224px"
                        className="rounded-xl object-cover transition-transform duration-500 ease-[var(--ease-brand)] group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    ) : (
                      <div className="rv-img-ph absolute inset-0 rounded-xl">
                        <span>{t("flyerFallback", { name: event.name })}</span>
                      </div>
                    )}
                  </Link>
                </div>
              </m.div>
            </div>
          );
        })}
      </div>

      <div className="absolute inset-x-0 bottom-0 mx-auto grid max-w-md grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
        <button
          type="button"
          onClick={previous}
          aria-label={t("previous")}
          className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-accent-border hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
        >
          <ArrowLeft className="size-4" weight="bold" />
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-extrabold">{activeEvent.name}</p>
          <p className="text-xs text-muted-foreground">
            {format.dateTime(new Date(activeEvent.startsAt), {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
            {" · "}
            {t("position", {
              current: activeIndex + 1,
              total: events.length,
            })}
          </p>
          <div
            className="mt-1.5 flex justify-center gap-1.5"
            aria-label={t("indicators")}
          >
            {events.map((event, index) => (
              <button
                key={event.id}
                type="button"
                onClick={() => select(index, true)}
                aria-label={t("goTo", { position: index + 1 })}
                aria-current={index === activeIndex ? "true" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-[width,background-color] motion-reduce:transition-none",
                  index === activeIndex
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-muted-foreground/45 hover:bg-muted-foreground",
                )}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={next}
          aria-label={t("next")}
          className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-accent-border hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
        >
          <ArrowRight className="size-4" weight="bold" />
        </button>
      </div>
    </div>
  );
}
