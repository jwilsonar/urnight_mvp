'use client';

import { ArrowsDownUp, CaretDown, CaretUp, FloppyDisk } from '@phosphor-icons/react';
import { m } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@urnight/ui';
import type { MesaPlantaDemo } from '@/lib/mock/paneles';

const STORAGE_KEY = 'ravenue.admin.table-order.v1';

function applySavedOrder(tables: MesaPlantaDemo[], ids: string[]): MesaPlantaDemo[] {
  const positions = new Map(ids.map((id, index) => [id, index]));
  return [...tables].sort(
    (a, b) => (positions.get(a.id) ?? tables.length) - (positions.get(b.id) ?? tables.length),
  );
}

function tableIds(tables: MesaPlantaDemo[]): string[] {
  return tables.map((table) => table.id);
}

export function MesasOrderEditor({ initialTables }: { initialTables: MesaPlantaDemo[] }) {
  const [tables, setTables] = useState(() => [...initialTables]);
  const [savedIds, setSavedIds] = useState(() => tableIds(initialTables));

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const ids = JSON.parse(raw) as string[];
      const ordered = applySavedOrder(initialTables, ids);
      setTables(ordered);
      setSavedIds(tableIds(ordered));
    } catch {
      // Si el mock local está corrupto, se conserva el orden inicial seguro.
    }
  }, [initialTables]);

  const currentIds = useMemo(() => tableIds(tables), [tables]);
  const hasChanges = currentIds.join('|') !== savedIds.join('|');

  function moveTo(tableId: string, position: number) {
    setTables((current) => {
      const from = current.findIndex((table) => table.id === tableId);
      const to = Math.min(Math.max(position, 0), current.length - 1);
      if (from < 0 || from === to) return current;
      const next = [...current];
      const [table] = next.splice(from, 1);
      if (!table) return current;
      next.splice(to, 0, table);
      return next;
    });
  }

  function saveOrder() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentIds));
    setSavedIds(currentIds);
    toast.success('Orden de mesas guardado.');
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <span className="rounded-md border border-border bg-muted p-2 text-rose">
          <ArrowsDownUp className="size-5" weight="duotone" />
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle>Orden de mesas</CardTitle>
          <CardDescription>
            Define la secuencia operativa para asignación y atención. El orden se conserva en este
            mock al recargar.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2" role="list" aria-label="Orden configurado de mesas">
          {tables.map((table, index) => (
            <m.div
              layout
              transition={{ duration: 0.18, ease: 'easeOut' }}
              key={table.id}
              role="listitem"
              className="grid gap-3 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center"
            >
              <Badge variant="outline" className="w-fit text-foreground">
                #{index + 1}
              </Badge>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{table.label}</p>
                <p className="text-xs text-muted-foreground">
                  {table.zone} · capacidad {table.cap}
                </p>
              </div>
              <Select
                value={String(index + 1)}
                onValueChange={(value) => moveTo(table.id, Number(value) - 1)}
              >
                <SelectTrigger className="w-24" aria-label={`Posición de ${table.label}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((_, optionIndex) => (
                    <SelectItem key={optionIndex} value={String(optionIndex + 1)}>
                      Orden {optionIndex + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === 0}
                  onClick={() => moveTo(table.id, index - 1)}
                  aria-label={`Subir ${table.label}`}
                >
                  <CaretUp weight="duotone" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === tables.length - 1}
                  onClick={() => moveTo(table.id, index + 1)}
                  aria-label={`Bajar ${table.label}`}
                >
                  <CaretDown weight="duotone" />
                </Button>
              </div>
            </m.div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={saveOrder} disabled={!hasChanges}>
            <FloppyDisk weight="duotone" /> Guardar orden
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
