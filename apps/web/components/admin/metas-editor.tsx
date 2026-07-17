'use client';

import { Plus, Target, Trash } from '@phosphor-icons/react';
import {
  Button,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@urnight/ui';
import { EmptyState } from '@/components/shared/empty-state';
import type { ReglaMetaDemo } from '@/lib/mock/politica';

interface MetasEditorProps {
  value: ReglaMetaDemo[];
  onChange: (metas: ReglaMetaDemo[]) => void;
}

export function MetasEditor({ value, onChange }: MetasEditorProps) {
  function actualizar(id: string, cambio: Partial<ReglaMetaDemo>) {
    onChange(value.map((meta) => (meta.id === id ? { ...meta, ...cambio } : meta)));
  }

  function agregar() {
    onChange([
      ...value,
      {
        id: `meta-${Date.now()}`,
        tipo: 'por_evento',
        umbral: 10,
        recompensaTipo: 'efectivo',
        recompensaValor: 100,
        activa: true,
      },
    ]);
  }

  function eliminar(id: string) {
    onChange(value.filter((meta) => meta.id !== id));
  }

  if (value.length === 0) {
    return (
      <EmptyState
        compact
        icon={<Target weight="duotone" />}
        title="Sin metas configuradas"
        description="Agrega una meta para reconocer el desempeño de tus promotores."
        action={
          <Button type="button" size="sm" onClick={agregar}>
            <Plus weight="duotone" /> Agregar meta
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {value.map((meta, indice) => (
          <div
            key={meta.id}
            className="grid gap-4 rounded-md border bg-white/[0.02] p-4 md:grid-cols-2 xl:grid-cols-[1.15fr_0.65fr_0.9fr_1fr_auto_auto] xl:items-end"
          >
            <div className="space-y-2">
              <Label>Tipo de meta</Label>
              <Select
                value={meta.tipo}
                onValueChange={(tipo) =>
                  actualizar(meta.id, { tipo: tipo as ReglaMetaDemo['tipo'] })
                }
              >
                <SelectTrigger aria-label={`Tipo de meta ${indice + 1}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="por_evento">Por evento</SelectItem>
                  <SelectItem value="acumulada_mes">Acumulada al mes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`meta-umbral-${meta.id}`}>Umbral</Label>
              <Input
                id={`meta-umbral-${meta.id}`}
                type="number"
                min={1}
                step={1}
                value={meta.umbral}
                onChange={(event) =>
                  actualizar(meta.id, { umbral: Math.max(1, Number(event.target.value)) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Recompensa</Label>
              <Select
                value={meta.recompensaTipo}
                onValueChange={(recompensaTipo) =>
                  actualizar(meta.id, {
                    recompensaTipo: recompensaTipo as ReglaMetaDemo['recompensaTipo'],
                  })
                }
              >
                <SelectTrigger aria-label={`Recompensa de la meta ${indice + 1}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo S/</SelectItem>
                  <SelectItem value="especie">En especie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {meta.recompensaTipo === 'efectivo' ? (
                <>
                  <Label htmlFor={`meta-monto-${meta.id}`}>Monto</Label>
                  <Input
                    id={`meta-monto-${meta.id}`}
                    type="number"
                    min={0}
                    step={1}
                    value={meta.recompensaValor}
                    onChange={(event) =>
                      actualizar(meta.id, {
                        recompensaValor: Math.max(0, Number(event.target.value)),
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <Label htmlFor={`meta-detalle-${meta.id}`}>Detalle</Label>
                  <Input
                    id={`meta-detalle-${meta.id}`}
                    value={meta.recompensaDetalle ?? ''}
                    placeholder="Ej. 1 botella"
                    onChange={(event) =>
                      actualizar(meta.id, { recompensaDetalle: event.target.value })
                    }
                  />
                </>
              )}
            </div>

            <label className="flex h-10 cursor-pointer items-center gap-2 text-sm font-semibold">
              <Checkbox
                checked={meta.activa}
                onCheckedChange={(checked) => actualizar(meta.id, { activa: checked === true })}
              />
              Activa
            </label>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => eliminar(meta.id)}
              aria-label={`Eliminar meta ${indice + 1}`}
              className="text-destructive hover:text-destructive"
            >
              <Trash weight="duotone" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={agregar}>
        <Plus weight="duotone" /> Agregar meta
      </Button>
    </div>
  );
}
