import { SquaresFour } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ZoneResponse } from "@urnight/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@urnight/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { getMusicGenres, getTags, getZones } from "@/lib/api/catalog";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("categories.metadata");
  return { title: t("title"), description: t("description") };
}

/** Chip-enlace a un listado filtrado. */
function ChipLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-[var(--accent-border-subtle)] hover:bg-[var(--accent-soft-faint)] hover:text-foreground"
    >
      {label}
    </Link>
  );
}

function CategorySection({
  title,
  items,
  hrefFor,
}: {
  title: string;
  items: ZoneResponse[];
  hrefFor: (item: ZoneResponse) => string;
}) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {items.map((item) => (
          <ChipLink key={item.id} href={hrefFor(item)} label={item.name} />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Explorar por categorías (#6/#7/#8): zonas, géneros y etiquetas del catálogo,
 * cada chip lleva al listado ya filtrado. Solo usa fetchers existentes.
 */
export default async function CategoriasPage() {
  const t = await getTranslations("categories");
  const [zones, genres, tags] = await Promise.all([
    getZones().catch(() => []),
    getMusicGenres().catch(() => []),
    getTags().catch(() => []),
  ]);

  const empty = zones.length === 0 && genres.length === 0 && tags.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {empty ? (
        <EmptyState
          icon={<SquaresFour className="h-10 w-10" weight="duotone" />}
          title={t("empty.title")}
          description={t("empty.description")}
        />
      ) : (
        <div className="space-y-6">
          <CategorySection
            title={t("zones")}
            items={zones}
            hrefFor={(z) => `/locals?zoneId=${z.id}`}
          />
          <CategorySection
            title={t("genres")}
            items={genres}
            hrefFor={(g) => `/events?genreId=${g.id}`}
          />
          <CategorySection
            title={t("tags")}
            items={tags}
            hrefFor={(item) => `/events?tagId=${item.id}`}
          />
        </div>
      )}
    </div>
  );
}
