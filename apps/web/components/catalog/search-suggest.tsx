"use client";

/**
 * Buscador global del header con sugerencias en vivo (feedback UX):
 * al escribir consulta eventos y locales (debounce 300ms) y despliega
 * coincidencias parciales; Enter o "Ver todos" van a /search, X limpia,
 * Escape o click fuera cierran. Reemplaza al SearchBar plano del header.
 */

import {
  CalendarBlank,
  MagnifyingGlass,
  MapPin,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { EventResponse, LocalResponse } from "@urnight/contracts";
import { Input } from "@urnight/ui";
import { getEvents, getLocals } from "@/lib/api/catalog";

export function SearchSuggest({ placeholder }: { placeholder?: string }) {
  const t = useTranslations("search");
  const format = useFormatter();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [locals, setLocals] = useState<LocalResponse[]>([]);

  // Debounce: consulta parcial mientras se escribe.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setEvents([]);
      setLocals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const [ev, lo] = await Promise.all([
        getEvents({ q }).catch(() => []),
        getLocals({ q }).catch(() => []),
      ]);
      setEvents(ev.slice(0, 4));
      setLocals(lo.slice(0, 3));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Cierra al hacer click fuera.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node))
        setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function clear() {
    setQuery("");
    setOpen(false);
  }

  function goToSearch() {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const hasResults = events.length > 0 || locals.length > 0;
  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative w-full">
      <MagnifyingGlass
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-label={t("aria")}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") goToSearch();
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder ?? t("placeholder")}
        className="h-10 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {query ? (
        <button
          type="button"
          aria-label={t("clear")}
          onClick={clear}
          className="absolute right-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : null}

      {showPanel ? (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-md border bg-popover shadow-overlay">
          {loading && !hasResults ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {t("searching")}
            </p>
          ) : hasResults ? (
            <div className="max-h-[420px] overflow-y-auto py-2">
              {events.length > 0 ? (
                <div className="px-2">
                  <p className="rv-eyebrow px-2 pb-1 pt-1.5">{t("events")}</p>
                  {events.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      onClick={clear}
                      className="flex items-center gap-2.5 rounded-sm px-2 py-2 text-sm transition-colors hover:bg-accent"
                    >
                      <CalendarBlank
                        className="size-4 shrink-0 text-rose"
                        weight="duotone"
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {event.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {format.dateTime(new Date(event.startsAt), {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
              {locals.length > 0 ? (
                <div className="px-2">
                  <p className="rv-eyebrow px-2 pb-1 pt-2.5">{t("venues")}</p>
                  {locals.map((local) => (
                    <Link
                      key={local.id}
                      href={`/locals/${local.slug}`}
                      onClick={clear}
                      className="flex items-center gap-2.5 rounded-sm px-2 py-2 text-sm transition-colors hover:bg-accent"
                    >
                      <MapPin
                        className="size-4 shrink-0 text-rose"
                        weight="duotone"
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {local.name}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={goToSearch}
                className="mt-1 block w-full border-t px-4 py-2.5 text-left text-sm font-semibold text-rose transition-colors hover:bg-accent"
              >
                {t("viewAll")} →
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              {t("noMatches", { query: query.trim() })}
              <button
                type="button"
                onClick={goToSearch}
                className="ml-1.5 font-semibold text-rose hover:underline"
              >
                {t("searchAnyway")} →
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
