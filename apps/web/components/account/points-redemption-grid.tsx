'use client';

import { CheckCircle } from '@phosphor-icons/react';
import { m } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@urnight/ui';
import { Reveal } from '@/components/shared/reveal';
import { CATALOGO_CANJE_DEMO, NIVEL_DEMO, type CanjeOpcionDemo } from '@/lib/mock/fidelizacion';

export function PointsRedemptionGrid() {
  const [selected, setSelected] = useState<CanjeOpcionDemo | null>(null);
  const [success, setSuccess] = useState<CanjeOpcionDemo | null>(null);
  const open = Boolean(selected || success);

  function redeem() {
    if (!selected) return;
    setSuccess(selected);
    setSelected(null);
    toast.success('¡Canje exitoso, disfruta!');
  }

  return (
    <>
      <div className="mt-4 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CATALOGO_CANJE_DEMO.map((option, index) => {
          const missing = Math.max(0, option.costoPuntos - NIVEL_DEMO.puntos);
          return (
            <Reveal key={option.id} delay={140 + (index % 3) * 60} className="h-full">
              <Card className={cn('flex h-full min-w-0 flex-col', !option.disponible && 'opacity-55')}>
                <CardHeader>
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <CardTitle className="min-w-0 font-heading text-base">{option.nombre}</CardTitle>
                    {!option.disponible ? <Badge variant="warning">Te faltan {missing} pts</Badge> : null}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="text-sm text-muted-foreground">{option.detalle}</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                    <span className="font-heading text-lg font-extrabold text-rose tabular-nums">
                      {option.costoPuntos.toLocaleString('es-PE')} pts
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!option.disponible}
                      onClick={() => {
                        setSuccess(null);
                        setSelected(option);
                      }}
                    >
                      Canjear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          );
        })}
      </div>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelected(null);
            setSuccess(null);
          }
        }}
      >
        <DialogContent>
          {success ? (
            <m.div
              className="py-5 text-center"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <m.div
                className="mx-auto flex size-20 items-center justify-center rounded-full border border-success-border bg-success-soft"
                initial={{ scale: 0.7 }}
                animate={{ scale: [0.7, 1.12, 1] }}
                transition={{ duration: 0.45 }}
              >
                <CheckCircle className="size-10 text-success" weight="fill" />
              </m.div>
              <DialogTitle className="mt-5 font-heading text-2xl">¡Canje exitoso, disfruta!</DialogTitle>
              <DialogDescription className="mt-2">{success.nombre} ya está disponible en tu cuenta.</DialogDescription>
              <Button className="mt-6" onClick={() => setSuccess(null)}>
                Listo
              </Button>
            </m.div>
          ) : selected ? (
            <>
              <DialogHeader>
                <DialogTitle>Confirmar canje</DialogTitle>
                <DialogDescription>
                  ¿Seguro que quieres canjear {selected.nombre} por {selected.costoPuntos.toLocaleString('es-PE')}{' '}
                  puntos?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Cancelar
                </Button>
                <Button onClick={redeem}>Sí, canjear</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
