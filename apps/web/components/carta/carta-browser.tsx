'use client';

import { Check, MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Input, cn } from '@urnight/ui';
import { useCart } from '@/components/carta/cart-provider';
import { ProductSheet } from '@/components/carta/product-sheet';
import { Reveal } from '@/components/shared/reveal';
import { StorageImage } from '@/lib/storage/storage-context';
import { formatPEN } from '@/lib/utils';
import {
  CARTA_CATEGORIAS_DEMO,
  CARTA_ITEMS_DEMO,
  CARTA_TAG_LABEL,
  type CartaItemDemo,
  type CartaTagDemo,
} from '@/lib/mock/carta';

const TAG_VARIANT: Record<CartaTagDemo, 'warning' | 'info' | 'success' | 'secondary'> = {
  '2x1': 'warning',
  especialidad: 'info',
  popular: 'success',
  nuevo: 'secondary',
};

/**
 * Navegador de la carta: chips de categoría + búsqueda + grid de productos.
 * Pensado móvil-primero (se usa dentro del local, de noche, con una mano).
 */
export function CartaBrowser() {
  const cart = useCart();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CartaItemDemo | null>(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CARTA_ITEMS_DEMO.filter(
      (item) =>
        (!categoryId || item.categoryId === categoryId) &&
        (!q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)),
    );
  }, [categoryId, query]);

  return (
    <div className="space-y-5">
      {/* Búsqueda */}
      <div className="relative">
        <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en la carta…"
          className="pl-9"
          aria-label="Buscar producto en la carta"
        />
      </div>

      {/* Chips de categorías */}
      <div className="un-hscroll -mx-4 flex gap-2 px-4 pb-1">
        <CategoryChip active={categoryId === null} onClick={() => setCategoryId(null)}>
          Todo
        </CategoryChip>
        {CARTA_CATEGORIAS_DEMO.map((cat) => (
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
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nada por aquí. Prueba con otra búsqueda o categoría.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={(i % 4) * 60}>
              <ProductCard
                item={item}
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
        'shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-glow'
          : 'border-border bg-surface text-muted-foreground hover:border-strong hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function ProductCard({
  item,
  onOpen,
  onAdd,
}: {
  item: CartaItemDemo;
  onOpen: () => void;
  onAdd: () => void;
}) {
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
        'un-zoom-img group relative flex h-full cursor-pointer flex-col overflow-hidden p-0 transition-[border-color,box-shadow] duration-200 hover:border-strong hover:shadow-float',
        !item.available && 'opacity-60',
      )}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`Ver ${item.name}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <StorageImage
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
        {!item.available ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
            <Badge variant="outline">Agotado</Badge>
          </div>
        ) : null}
        {item.tags.length > 0 ? (
          <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              // Fondo casi opaco sobre la foto (mismo patrón que event-card):
              // los variants soft translúcidos no se leen encima de imágenes.
              <Badge key={tag} variant={TAG_VARIANT[tag]} className="bg-deep/90 backdrop-blur-sm">
                {CARTA_TAG_LABEL[tag]}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-heading text-sm font-bold leading-tight">{item.name}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-heading text-sm font-extrabold text-lavender">
            {formatPEN(item.priceSoles)}
          </span>
          <Button
            size="icon"
            className={cn('size-8 transition-colors', added && 'bg-success hover:bg-success')}
            disabled={!item.available}
            aria-label={`Agregar ${item.name} al pedido`}
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
          </Button>
        </div>
      </div>
    </Card>
  );
}
