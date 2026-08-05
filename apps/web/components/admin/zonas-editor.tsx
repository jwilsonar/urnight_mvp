"use client";

import Link from "next/link";
import {
  CaretDown,
  CaretUp,
  MapPinArea,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { Button, Checkbox, Input, cn } from "@urnight/ui";
import { EmptyState } from "@/components/shared/empty-state";
import type { ZonaLocalDemo } from "@/lib/mock/politica";

const COLORES_ZONA = [
  "#ff1f3d",
  "#f59e0b",
  "#ef4444",
  "#22c55e",
  "#38bdf8",
] as const;

interface ZonasEditorProps {
  value: ZonaLocalDemo[];
  onChange: (zonas: ZonaLocalDemo[]) => void;
}

function conOrden(zonas: ZonaLocalDemo[]): ZonaLocalDemo[] {
  return zonas.map((zona, indice) => ({ ...zona, orden: indice + 1 }));
}

function AforoResumen({ total }: { total: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-4 py-3">
      <span className="text-sm font-semibold">Aforo total del local</span>
      <strong className="font-heading text-lg tabular-nums">
        {total.toLocaleString("es-PE")} personas
      </strong>
    </div>
  );
}

function NotaAforo() {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      El aforo es la capacidad de referencia de la zona. El número de entradas a la venta se
      define por evento, en los tipos de entrada (General / VIP / Premium).{" "}
      <Link
        href="/panel/admin/events"
        className="font-semibold text-primary underline-offset-4 hover:underline"
      >
        Ir a eventos
      </Link>
      .
    </p>
  );
}

export function ZonasEditor({ value, onChange }: ZonasEditorProps) {
  const aforoTotal = value
    .filter((zona) => zona.activa)
    .reduce((total, zona) => total + (zona.aforo ?? 0), 0);

  function actualizar(id: string, cambio: Partial<ZonaLocalDemo>) {
    onChange(
      value.map((zona) => (zona.id === id ? { ...zona, ...cambio } : zona)),
    );
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
        nombre: "Nueva zona",
        orden: value.length + 1,
        color: COLORES_ZONA[value.length % COLORES_ZONA.length] ?? "#ff1f3d",
        activa: true,
      },
    ]);
  }

  function eliminar(id: string) {
    onChange(conOrden(value.filter((zona) => zona.id !== id)));
  }

  if (value.length === 0) {
    return (
      <div className="space-y-4">
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
        <AforoResumen total={0} />
        <NotaAforo />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {value.map((zona, indice) => (
          <div
            key={zona.id}
            className="grid gap-3 rounded-md border bg-muted/30 p-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem]"
          >
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-muted-foreground">Zona</span>
              <Input
                value={zona.nombre}
                onChange={(event) =>
                  actualizar(zona.id, { nombre: event.target.value })
                }
                aria-label={`Nombre de la zona ${indice + 1}`}
              />
            </label>

            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-muted-foreground">
                Pulsera <span className="font-normal">(opcional)</span>
              </span>
              <Input
                value={zona.pulseraEtiqueta ?? ""}
                onChange={(event) =>
                  actualizar(zona.id, { pulseraEtiqueta: event.target.value })
                }
                aria-label={`Pulsera de ${zona.nombre}`}
                placeholder={zona.nombre}
              />
              <span className="block text-xs text-muted-foreground">
                Si queda vacía, hereda el nombre de la zona.
              </span>
            </label>

            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-muted-foreground">Aforo</span>
              <Input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={zona.aforo ?? ""}
                onChange={(event) => {
                  const aforo = event.target.value;
                  actualizar(zona.id, {
                    aforo:
                      aforo === ""
                        ? undefined
                        : Math.max(0, Math.floor(Number(aforo))),
                  });
                }}
                aria-label={`Aforo de ${zona.nombre}`}
                placeholder="Sin definir"
              />
            </label>

            <div className="flex flex-wrap items-center gap-4 lg:col-span-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Color de pulsera
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Es el color de la pulsera que se entrega en puerta.
                  </p>
                </div>
                <div
                  className="flex items-center gap-1.5"
                  role="group"
                  aria-label={`Color de pulsera de ${zona.nombre}`}
                >
                  {COLORES_ZONA.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Usar color ${color}`}
                      aria-pressed={zona.color === color}
                      onClick={() => actualizar(zona.id, { color })}
                      className={cn(
                        "size-7 rounded-full border-2 border-background ring-offset-2 ring-offset-background transition-shadow",
                        zona.color === color && "ring-2 ring-ring",
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <Checkbox
                  checked={zona.activa}
                  onCheckedChange={(checked) =>
                    actualizar(zona.id, { activa: checked === true })
                  }
                />
                Activa
              </label>

              <div className="ml-auto flex items-center justify-end gap-1">
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
          </div>
        ))}
      </div>

      <AforoResumen total={aforoTotal} />

      <Button type="button" variant="outline" size="sm" onClick={agregar}>
        <Plus weight="duotone" /> Agregar zona
      </Button>

      <NotaAforo />
    </div>
  );
}
