import { MapPin, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@urnight/ui";
import { LocalCard } from "@/components/catalog/local-card";
import { ZoneFilter } from "@/components/catalog/zone-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/reveal";
import { getLocals, getZones } from "@/lib/api/catalog";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("locals.metadata");
  return { title: t("title"), description: t("description") };
}

interface LocalsSearchParams {
  zoneId?: string;
  q?: string;
}

function localsHref(
  current: LocalsSearchParams,
  updates: Partial<LocalsSearchParams>,
): string {
  const params = new URLSearchParams();
  const q = Object.hasOwn(updates, "q") ? updates.q : current.q;
  const zoneId = Object.hasOwn(updates, "zoneId")
    ? updates.zoneId
    : current.zoneId;
  if (q) params.set("q", q);
  if (zoneId) params.set("zoneId", zoneId);
  const query = params.toString();
  return query ? `/locals?${query}` : "/locals";
}

export default async function LocalsPage({
  searchParams,
}: {
  searchParams: Promise<LocalsSearchParams>;
}) {
  const t = await getTranslations("locals");
  const filters = await searchParams;
  const { zoneId, q } = filters;
  // Degrada con elegancia si el API no responde (evita romper el build ISR).
  const [zones, locals] = await Promise.all([
    getZones().catch(() => []),
    getLocals({ zoneId, q }).catch(() => null),
  ]);
  const selectedZone = zones.find((zone) => zone.id === zoneId);
  const activeFilters = [
    ...(q
      ? [
          {
            kind: "query",
            label: q,
            href: localsHref(filters, { q: undefined }),
          },
        ]
      : []),
    ...(zoneId
      ? [
          {
            kind: "zone",
            label: selectedZone?.name ?? t("zoneFallback"),
            href: localsHref(filters, { zoneId: undefined }),
          },
        ]
      : []),
  ];
  const suggestedFilter =
    activeFilters.find((filter) => filter.kind === "zone") ?? activeFilters[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        {/* La búsqueda vive en el header (con sugerencias); aquí solo el filtro por zona. */}
        <ZoneFilter
          zones={zones}
          pathname="/locals"
          ariaLabel={t("filterAria")}
          allLabel={t("allZones")}
        />
      </div>

      {/* Aquí solo hay un filtro a la vez (la zona) y el propio selector la
          muestra marcada. Listarla aparte y ofrecer "limpiar todo" para un
          único filtro era ocupar espacio para no decir nada nuevo. */}

      {locals !== null ? (
        <p className="mb-5 text-sm text-muted-foreground" role="status">
          {t("results", { count: locals.length })}
        </p>
      ) : null}

      {locals === null ? (
        <EmptyState
          icon={<MapPin className="h-10 w-10" weight="duotone" />}
          title={t("loadError.title")}
          description={t("loadError.description")}
        />
      ) : locals.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-10 w-10" weight="duotone" />}
          title={
            activeFilters.length > 0
              ? t("empty.filteredTitle")
              : t("empty.title")
          }
          description={
            suggestedFilter
              ? t("empty.filteredDescription", {
                  filter: suggestedFilter.label,
                })
              : t("empty.description")
          }
          action={
            <Button asChild variant="ghost" className="w-56 max-w-full">
              <Link href={suggestedFilter?.href ?? "/locals"}>
                {suggestedFilter
                  ? t("empty.removeFilter", { filter: suggestedFilter.label })
                  : t("empty.action")}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {locals.map((local, i) => (
            <Reveal key={local.id} delay={(i % 3) * 80}>
              <LocalCard local={local} />
            </Reveal>
          ))}
        </div>
      )}

      {/* Bloque de afiliación del prototipo (cierra el listado de locales) */}
      <section className="pt-16">
        <Reveal>
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-accent-border bg-[linear-gradient(180deg,var(--accent-soft),transparent)] px-6 py-14 text-center">
            <span className="flex size-16 items-center justify-center rounded-xl border border-accent-border bg-accent">
              <ShieldCheck className="size-7 text-rose" weight="duotone" />
            </span>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t("affiliate.title")}
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("affiliate.description")}
            </p>
            <Button size="lg" className="mt-2" asChild>
              <Link href="/afiliar">{t("affiliate.action")}</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
