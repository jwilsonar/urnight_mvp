"use client";

import { ForkKnife, MagnifyingGlass, Warning } from "@phosphor-icons/react";
import type {
  MenuCategoryResponse,
  MenuProductResponse,
} from "@urnight/contracts";
import { useMemo, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, Input, cn } from "@urnight/ui";
import { ProductSheet } from "@/components/carta/product-sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/reveal";
import { StorageImage } from "@/lib/storage/storage-context";

const TAG_VARIANT: Record<
  string,
  "warning" | "info" | "success" | "secondary"
> = {
  "2x1": "warning",
  especialidad: "info",
  popular: "success",
  nuevo: "secondary",
};

const ALCOHOL_CATEGORY_TERMS = [
  "coctel",
  "cocktail",
  "botella",
  "bottle",
  "cerveza",
  "beer",
  "shot",
];

function comparable(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Navegador de la carta: chips de categoría + búsqueda + grid de productos.
 * Pensado móvil-primero (se usa dentro del local, de noche, con una mano).
 */
export function CartaBrowser({
  localId,
  categories,
  products,
}: {
  localId: string;
  categories: readonly MenuCategoryResponse[];
  products: readonly MenuProductResponse[];
}) {
  const t = useTranslations("carta");
  const locale = useLocale();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MenuProductResponse | null>(null);

  const items = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale);
    return products.filter(
      (item) =>
        (!categoryId || item.categoryId === categoryId) &&
        (!q ||
          item.name.toLocaleLowerCase(locale).includes(q) ||
          item.description?.toLocaleLowerCase(locale).includes(q)),
    );
  }, [categoryId, locale, products, query]);
  const alcoholCategoryIds = useMemo(
    () =>
      new Set(
        categories
          .filter((category) =>
            ALCOHOL_CATEGORY_TERMS.some((term) =>
              comparable(category.name).includes(term),
            ),
          )
          .map((category) => category.id),
      ),
    [categories],
  );
  const showsAlcoholWarning = items.some((item) =>
    alcoholCategoryIds.has(item.categoryId),
  );

  return (
    <div className="space-y-5">
      {/* Búsqueda */}
      <div className="relative">
        <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
          aria-label={t("searchAria")}
        />
      </div>

      {/* Chips de categorías */}
      <div className="rv-hscroll -mx-4 flex gap-2 px-4 pb-1">
        <CategoryChip
          active={categoryId === null}
          onClick={() => setCategoryId(null)}
        >
          {t("all")}
        </CategoryChip>
        {categories.map((cat) => (
          <CategoryChip
            key={cat.id}
            active={categoryId === cat.id}
            onClick={() => setCategoryId(cat.id)}
          >
            {cat.name}
          </CategoryChip>
        ))}
      </div>

      {/* Grid de productos */}
      {items.length === 0 ? (
        <EmptyState
          icon={<MagnifyingGlass weight="duotone" />}
          title={t("empty.title")}
          description={t("empty.description")}
          action={
            <Button
              variant="ghost"
              onClick={() => {
                setQuery("");
                setCategoryId(null);
              }}
            >
              {t("empty.action")}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={(i % 4) * 60}>
              <ProductCard
                item={item}
                onOpen={() => setSelected(item)}
              />
            </Reveal>
          ))}
        </div>
      )}

      {showsAlcoholWarning ? (
        <aside className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
            <Warning aria-hidden="true" className="size-4" weight="duotone" />
          </span>
          <p className="pt-0.5 leading-relaxed text-muted-foreground">
            <strong className="font-semibold text-foreground">
              {t("alcoholWarning.excess")}
            </strong>{" "}
            {t("alcoholWarning.minors")}
          </p>
        </aside>
      ) : null}

      <ProductSheet
        localId={localId}
        item={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:border-strong hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ProductCard({
  item,
  onOpen,
}: {
  item: MenuProductResponse;
  onOpen: () => void;
}) {
  const t = useTranslations("carta");
  const format = useFormatter();
  const itemName = item.name;

  return (
    <Card
      className={cn(
        "rv-zoom-img group relative flex h-full cursor-pointer flex-col overflow-hidden p-0 transition-[border-color,box-shadow] duration-200 hover:border-strong hover:shadow-float",
        !item.isAvailable && "opacity-60",
      )}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={t("viewItem", { item: itemName })}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {item.imageUrl ? (
          <StorageImage
            src={item.imageUrl}
            alt={itemName}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
            <ForkKnife aria-hidden="true" className="size-10" weight="duotone" />
          </div>
        )}
        {!item.isAvailable ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
            <Badge variant="outline">{t("soldOut")}</Badge>
          </div>
        ) : null}
        {item.tags.length > 0 ? (
          <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              // Fondo casi opaco sobre la foto (mismo patrón que event-card):
              // los variants soft translúcidos no se leen encima de imágenes.
              <Badge
                key={tag}
                variant={TAG_VARIANT[tag] ?? "secondary"}
                className="bg-deep/90 backdrop-blur-sm"
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-heading text-sm font-bold leading-tight">
          {itemName}
        </h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {item.description ?? t("product.noDescription")}
        </p>
        <div className="mt-auto pt-2">
          <span className="font-heading text-sm font-extrabold text-rose">
            {format.number(item.priceAmount, {
              style: "currency",
              currency: item.priceCurrency,
            })}
          </span>
        </div>
      </div>
    </Card>
  );
}
