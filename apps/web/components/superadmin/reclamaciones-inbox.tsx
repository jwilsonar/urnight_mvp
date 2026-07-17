'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@urnight/ui';
import {
  RECLAMACION_ESTADO_LABEL,
  RECLAMACIONES_DEMO,
  type ReclamacionDemo,
  type ReclamacionEstadoDemo,
} from '@/lib/mock/reclamaciones';

const ESTADO_VARIANT: Record<ReclamacionEstadoDemo, 'warning' | 'info' | 'success'> = {
  nueva: 'warning',
  en_revision: 'info',
  resuelta: 'success',
};

/**
 * Bandeja demo del Libro de Reclamaciones: tabla + detalle en Dialog con
 * acciones que avanzan el estado en memoria. Con backend real las acciones
 * son mutaciones del módulo trust/ops y notifican al usuario y al local.
 */
export function ReclamacionesInbox() {
  const [items, setItems] = useState<ReclamacionDemo[]>(RECLAMACIONES_DEMO);
  const [selected, setSelected] = useState<ReclamacionDemo | null>(null);

  const setEstado = (id: string, estado: ReclamacionEstadoDemo) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, estado } : r)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, estado } : prev));
  };

  return (
    <>
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Reclamo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer transition-colors"
                onClick={() => setSelected(r)}
              >
                <TableCell className="font-mono text-xs">{r.codigo}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.fechaLabel}</TableCell>
                <TableCell className="font-semibold">{r.usuario}</TableCell>
                <TableCell>{r.local}</TableCell>
                <TableCell className="capitalize">{r.tipo}</TableCell>
                <TableCell className="max-w-52 truncate">{r.resumen}</TableCell>
                <TableCell>
                  <Badge variant={ESTADO_VARIANT[r.estado]}>
                    {RECLAMACION_ESTADO_LABEL[r.estado]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        {selected ? (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{selected.codigo}</span>
                <Badge variant={ESTADO_VARIANT[selected.estado]}>
                  {RECLAMACION_ESTADO_LABEL[selected.estado]}
                </Badge>
              </div>
              <DialogTitle>{selected.resumen}</DialogTitle>
              <DialogDescription>
                {selected.usuario} · {selected.local} · {selected.fechaLabel} ·{' '}
                <span className="capitalize">{selected.tipo}</span>
              </DialogDescription>
            </DialogHeader>

            <p className="text-sm leading-relaxed text-muted-foreground">{selected.detalle}</p>
            <Badge variant="info" className="self-start">
              Demo — las acciones notificarán al usuario con el backend
            </Badge>

            <DialogFooter>
              {selected.estado === 'nueva' ? (
                <Button variant="secondary" onClick={() => setEstado(selected.id, 'en_revision')}>
                  Marcar en revisión
                </Button>
              ) : null}
              {selected.estado !== 'resuelta' ? (
                <Button onClick={() => setEstado(selected.id, 'resuelta')}>Resolver</Button>
              ) : (
                <Button variant="secondary" onClick={() => setSelected(null)}>
                  Cerrar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
