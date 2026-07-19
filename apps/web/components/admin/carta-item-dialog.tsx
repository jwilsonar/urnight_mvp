'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from '@urnight/ui';
import {
  CARTA_CATEGORIAS_DEMO,
  CARTA_TAG_LABEL,
  type CartaItemDemo,
  type CartaTagDemo,
} from '@/lib/mock/carta';

const EMPTY: Omit<CartaItemDemo, 'id'> = {
  categoryId: CARTA_CATEGORIAS_DEMO[0]!.id,
  name: '',
  description: '',
  priceSoles: 0,
  imageUrl: 'https://picsum.photos/seed/carta-nuevo/640/480',
  available: true,
  tags: [],
};

/**
 * Crear/editar producto de la carta (demo, patrón create-event-dialog pero en
 * estado local). Con backend real el submit llama al módulo de catálogo
 * in-venue y la imagen usa staged-image-field + presigned upload.
 */
export function CartaItemDialog({
  open,
  initial,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  initial: CartaItemDemo | null;
  onOpenChange: (open: boolean) => void;
  onSave: (item: CartaItemDemo) => void;
}) {
  const [form, setForm] = useState<Omit<CartaItemDemo, 'id'>>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  // Reset al abrir: valores del producto en edición o formulario vacío.
  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : EMPTY);
      setError(null);
    }
  }, [open, initial]);

  const toggleTag = (tag: CartaTagDemo) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const submit = () => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (!(form.priceSoles > 0)) {
      setError('El precio debe ser mayor a 0.');
      return;
    }
    onSave({
      id: initial?.id ?? `nuevo-${form.name.trim().toLowerCase().replace(/\s+/g, '-')}`,
      ...form,
      name: form.name.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          <DialogDescription>
            {initial
              ? 'Ajusta los datos del producto de tu carta.'
              : 'Registra un producto para tu carta in-venue.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-nombre">Nombre</Label>
              <Input
                id="item-nombre"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej. Chilcano de Maracuyá"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-precio">Precio (S/)</Label>
              <Input
                id="item-precio"
                type="number"
                min={0}
                step={0.5}
                value={form.priceSoles || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priceSoles: Number(e.target.value) }))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-categoria">Categoría</Label>
            <Select
              value={form.categoryId}
              onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
            >
              <SelectTrigger id="item-categoria">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARTA_CATEGORIAS_DEMO.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-descripcion">Descripción</Label>
            <Textarea
              id="item-descripcion"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Qué lleva, cómo se sirve, qué incluye…"
            />
          </div>

          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CARTA_TAG_LABEL) as CartaTagDemo[]).map((tag) => {
                const active = form.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-150',
                      active
                        ? 'border-primary bg-accent text-rose'
                        : 'border-border text-muted-foreground hover:border-strong',
                    )}
                  >
                    {CARTA_TAG_LABEL[tag]}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.available}
              onCheckedChange={(v) => setForm((f) => ({ ...f, available: v === true }))}
            />
            Disponible esta noche
          </label>

          {error ? <p className="text-sm text-error">{error}</p> : null}
          <Badge variant="info">Demo — se guarda al conectar el backend</Badge>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>{initial ? 'Guardar cambios' : 'Crear producto'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
