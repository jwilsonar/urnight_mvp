'use client';

import { CaretLeft, CaretRight, Images, MapPin, SquaresFour } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import type { LocalImageResponse } from '@urnight/contracts';
import { Button, Dialog, DialogContent, DialogTitle } from '@urnight/ui';
import { StorageImage } from '@/lib/storage/storage-context';

interface LocalGalleryProps {
  images: LocalImageResponse[];
  localName: string;
  /** Portada de respaldo cuando el local aún no tiene galería propia. */
  fallbackImageUrl?: string | null;
}

/**
 * Galería del detalle de local: grid tipo "hero + mosaico" con lightbox.
 * El lightbox abre en vista individual (clic en una foto) o en "vista general"
 * — un mosaico con todas las fotos (botón "Ver galería (N)").
 */
export function LocalGallery({ images, localName, fallbackImageUrl }: LocalGalleryProps) {
  // Ordenadas por sort_order (la API ya las entrega así; reforzamos por si acaso).
  const photos = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  const [open, setOpen] = useState(false);
  const [overview, setOverview] = useState(false);
  const [index, setIndex] = useState(0);

  const count = photos.length;
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  const openAt = (i: number) => {
    setIndex(i);
    setOverview(false);
    setOpen(true);
  };
  const openOverview = () => {
    setOverview(true);
    setOpen(true);
  };

  // Navegación con teclado en la vista individual.
  useEffect(() => {
    if (!open || overview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, overview, next, prev]);

  // Sin galería: portada de respaldo o placeholder (no se abre lightbox).
  if (count === 0) {
    return (
      <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
        {fallbackImageUrl ? (
          <StorageImage
            src={fallbackImageUrl}
            alt={localName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <MapPin className="h-12 w-12" weight="duotone" />
          </div>
        )}
      </div>
    );
  }

  const hero = photos[0];
  if (!hero) return null; // inalcanzable (count > 0), pero estrecha el tipo
  const side = photos.slice(1, 5);
  const current = photos[index] ?? hero;

  return (
    <>
      <div className="relative mb-6">
        <div className="grid grid-cols-1 gap-1.5 overflow-hidden rounded-xl sm:h-[58vh] sm:max-h-[460px] sm:grid-cols-4 sm:grid-rows-2">
          {/* Hero: ocupa toda la columna si no hay fotos secundarias. */}
          <button
            type="button"
            onClick={() => openAt(0)}
            className={`group relative aspect-[16/9] bg-muted sm:aspect-auto sm:row-span-2 ${
              side.length ? 'sm:col-span-2' : 'sm:col-span-4'
            }`}
          >
            <StorageImage
              src={hero.url}
              alt={`${localName} — foto 1`}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          </button>

          {/* Mosaico secundario: solo en pantallas grandes. */}
          {side.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => openAt(i + 1)}
              className="group relative hidden bg-muted sm:block"
            >
              <StorageImage
                src={photo.url}
                alt={`${localName} — foto ${i + 2}`}
                fill
                sizes="25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={openOverview}
          // Borde marcado (accent) sobre la foto: define los límites del botón,
          // que con solo el fill translúcido se perdían contra la imagen.
          className="absolute bottom-3 right-3 gap-2 border border-accent-border bg-background/90 shadow-md backdrop-blur hover:bg-background"
        >
          <Images className="h-4 w-4" weight="fill" />
          Ver galería ({count})
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 border-0 bg-background/95 p-0 backdrop-blur sm:rounded-none">
          <DialogTitle className="sr-only">Galería de {localName}</DialogTitle>

          {/* Barra superior: contador + alternar vista. */}
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 sm:px-6">
            <span className="text-sm text-muted-foreground">
              {overview ? `${count} fotos` : `${index + 1} / ${count}`}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOverview((v) => !v)}
              // Outline en vez de ghost: el toggle tenía límites invisibles.
              className="mr-10 gap-2 text-foreground"
            >
              {overview ? (
                <>
                  <Images className="h-4 w-4" /> Ver foto
                </>
              ) : (
                <>
                  <SquaresFour className="h-4 w-4" /> Vista general
                </>
              )}
            </Button>
          </div>

          {overview ? (
            /* Vista general: mosaico con todas las fotos. */
            <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-4 sm:grid-cols-3 sm:p-6">
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    setOverview(false);
                  }}
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
                >
                  <StorageImage
                    src={photo.url}
                    alt={`${localName} — foto ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          ) : (
            /* Vista individual: foto grande + navegación + tira de miniaturas. */
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="relative flex-1">
                <StorageImage
                  src={current.url}
                  alt={`${localName} — foto ${index + 1}`}
                  fill
                  priority
                  sizes="100vw"
                  className="object-contain"
                />
                {count > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={prev}
                      aria-label="Foto anterior"
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
                    >
                      <CaretLeft className="h-5 w-5" weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={next}
                      aria-label="Foto siguiente"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
                    >
                      <CaretRight className="h-5 w-5" weight="bold" />
                    </button>
                  </>
                ) : null}
              </div>

              {count > 1 ? (
                <div className="flex gap-2 overflow-x-auto border-t border-border/50 p-3">
                  {photos.map((photo, i) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Ir a la foto ${i + 1}`}
                      className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted transition-opacity ${
                        i === index ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <StorageImage src={photo.url} alt="" fill sizes="80px" className="object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
