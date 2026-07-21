"use client";

import { Check, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, Input, cn } from "@urnight/ui";
import { useCart } from "@/components/carta/cart-provider";
import { ProductSheet } from "@/components/carta/product-sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/reveal";
import { StorageImage } from "@/lib/storage/storage-context";
import {
  CARTA_CATEGORIAS_DEMO,
  CARTA_ITEMS_DEMO,
  type CartaItemDemo,
  type CartaTagDemo,
} from "@/lib/mock/carta";

const TAG_VARIANT: Record<
  CartaTagDemo,
  "warning" | "info" | "success" | "secondary"
> = {
  "2x1": "warning",
  especialidad: "info",
  popular: "success",
  nuevo: "secondary",
};

/**
 * Navegador de la carta: chips de categoría + búsqueda + grid de productos.
 * Pensado móvil-primero (se usa dentro del local, de noche, con una mano).
 */
export function CartaBrowser() {
  const t = useTranslations("carta");
  const locale = useLocale();
  const cart = useCart();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CartaItemDemo | null>(null);

  const items = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale);
    return CARTA_ITEMS_DEMO.filter(
      (item) =>
        (!categoryId || item.categoryId === categoryId) &&
        (!q ||
          t(`items.${item.id}.name`).toLocaleLowerCase(locale).includes(q) ||
          t(`items.${item.id}.description`)
            .toLocaleLowerCase(locale)
            .includes(q)),
    );
  }, [categoryId, locale, query, t]);

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
        {CARTA_CATEGORIAS_DEMO.map((cat) => (
          <CategoryChip
            key={cat.id}
            active={categoryId === cat.id}
            onClick={() => setCategoryId(cat.id)}
          >
            {t(`categories.${cat.id}`)}
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
                qtyInCart={
                  cart.lines.find((l) => l.itemId === item.id)?.quantity ?? 0
                }
                onOpen={() => setSelected(item)}
                onAdd={() => cart.add(item.id)}
              />
            </Reveal>
          ))}
        </div>
      )}

      <ProductSheet
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
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-glow"
          : "border-border bg-surface text-muted-foreground hover:border-strong hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ProductCard({
  item,
  qtyInCart,
  onOpen,
  onAdd,
}: {
  item: CartaItemDemo;
  /** Unidades de este producto ya en el pedido (para el contador del botón). */
  qtyInCart: number;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const t = useTranslations("carta");
  const format = useFormatter();
  const itemName = t(`items.${item.id}.name`);
  // Feedback inmediato del "+": muestra un check ~1s tras agregar, para que se
  // note que el producto entró al pedido (el FAB "Ver pedido" aparece abajo).
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1000);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <Card
      className={cn(
        "rv-zoom-img group relative flex h-full cursor-pointer flex-col overflow-hidden p-0 transition-[border-color,box-shadow] duration-200 hover:border-strong hover:shadow-float",
        !item.available && "opacity-60",
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
        <StorageImage
          src={item.imageUrl}
          alt={itemName}
          fill
          sizes="(max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
        {!item.available ? (
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
                variant={TAG_VARIANT[tag]}
                className="bg-deep/90 backdrop-blur-sm"
              >
                {t(`tags.${tag}`)}
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
          {t(`items.${item.id}.description`)}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-heading text-sm font-extrabold text-rose">
            {format.number(item.priceSoles, {
              style: "currency",
              currency: "PEN",
            })}
          </span>
          {/* El "+" hace "agregado rápido" (sin abrir el detalle). Contador
              persistente = feedback claro de cuántas unidades ya van en el
              pedido; el check de 1s confirma el toque más reciente. */}
          <Button
            size="icon"
            className={cn(
              "relative size-8 transition-colors",
              added && "bg-success hover:bg-success",
            )}
            disabled={!item.available}
            aria-label={
              qtyInCart > 0
                ? t("addAnotherAria", { item: itemName, count: qtyInCart })
                : t("addAria", { item: itemName })
            }
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
              setAdded(true);
            }}
          >
            {added ? (
              <Check className="size-4" weight="bold" />
            ) : (
              <Plus className="size-4" weight="bold" />
            )}
            {qtyInCart > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full border border-background bg-rose px-1 text-[11px] font-bold leading-[18px] text-deep">
                {qtyInCart}
              </span>
            ) : null}
          </Button>
        </div>
      </div>
    </Card>
  );
}
