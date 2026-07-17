'use client';

import { CaretDown, CaretUp, MapPinArea, Plus, Trash } from '@phosphor-icons/react';
import { Button, Checkbox, Input, cn } from '@urnight/ui';
import { EmptyState } from '@/components/shared/empty-state';
import type { ZonaLocalDemo } from '@/lib/mock/politica';

const COLORES_ZONA = ['#8f78ff', '#f59e0b', '#ef4444', '#22c55e', '#38bdf8'] as const;

interface ZonasEditorProps {
  value: ZonaLocalDemo[];
  onChange: (zonas: ZonaLocalDemo[]) => void;
}

function conOrden(zonas: ZonaLocalDemo[]): ZonaLocalDemo[] {
  return zonas.map((zona, indice) => ({ ...zona, orden: indice + 1 }));
}

export function ZonasEditor({ value, onChange }: ZonasEditorProps) {
  function actualizar(id: string, cambio: Partial<ZonaLocalDemo>) {
    onChange(value.map((zona) => (zona.id === id ? { ...zona, ...cambio } : zona)));
  }

  function mover(indice: number, delta: -1 | 1) {
    const destino = indice + delta;
    if (destino < 0 || destino >= value.length) return;

    const zonas = [...value];
    const zonaActual = zonas[indice];
    const zonaDestino = zonas[destino];
    if (!zonaActual || !zonaDestino) return;
    zonas[indice] = zonaDestino;
    zonas[destino] = zonaActual;
    onChange(conOrden(zonas));
  }

  function agregar() {
    const id = `zona-${Date.now()}`;
    onChange([
      ...value,
      {
        id,
        nombre: 'Nueva zona',
        orden: value.length + 1,
        color: COLORES_ZONA[value.length % COLORES_ZONA.length] ?? '#8f78ff',
        activa: true,
      },
    ]);
  }

  function eliminar(id: string) {
    onChange(conOrden(value.filter((zona) => zona.id !== id)));
  }

  if (value.length === 0) {
    return (
      <EmptyState
        compact
        icon={<MapPinArea weight="duotone" />}
        title="Sin zonas configuradas"
        description="Agrega la primera zona para ordenar el acceso del local."
        action={
          <Button type="button" size="sm" onClick={agregar}>
            <Plus weight="duotone" /> Agregar zona
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {value.map((zona, indice) => (
          <div
            key={zona.id}
            className="grid gap-3 rounded-md border bg-white/[0.02] p-3.5 lg:grid-cols-[minmax(180px,1fr)_auto_auto_auto] lg:items-center"
          >
            <Input
              value={zona.nombre}
              onChange={(event) => actualizar(zona.id, { nombre: event.target.value })}
              aria-label={`Nombre de la zona ${indice + 1}`}
            />

            <div className="flex items-center gap-1.5" aria-label={`Color de ${zona.nombre}`}>
              {COLORES_ZONA.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Usar color ${color}`}
                  aria-pressed={zona.color === color}
                  onClick={() => actualizar(zona.id, { color })}
                  className={cn(
                    'size-7 rounded-full border-2 border-background ring-offset-2 ring-offset-background transition-shadow',
                    zona.color === color && 'ring-2 ring-primary',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <Checkbox
                checked={zona.activa}
                onCheckedChange={(checked) => actualizar(zona.id, { activa: checked === true })}
              />
              Activa
            </label>

            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => mover(indice, -1)}
                disabled={indice === 0}
                aria-label={`Subir ${zona.nombre}`}
              >
                <CaretUp weight="duotone" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => mover(indice, 1)}
                disabled={indice === value.length - 1}
                aria-label={`Bajar ${zona.nombre}`}
              >
                <CaretDown weight="duotone" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => eliminar(zona.id)}
                aria-label={`Eliminar ${zona.nombre}`}
                className="text-destructive hover:text-destructive"
              >
                <Trash weight="duotone" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={agregar}>
        <Plus weight="duotone" /> Agregar zona
      </Button>
    </div>
  );
}
