'use client';

import { CheckCircle, QrCode, UsersThree, XCircle } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Card } from '@urnight/ui';
import { PaloteoRegistrar } from '@/components/admin/paloteo-registrar';
import { listarPaloteosDemo, type PaloteoDemo } from '@/lib/mock/paloteo';
import { CHECKINS_DEMO } from '@/lib/mock/paneles';

interface FeedItem {
  id: string;
  hora: string;
  orden: number;
  nombre: string;
  detalle: string;
  valido: boolean;
  promotorNombre?: string;
}

function horaCorta(fechaIso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(fechaIso));
}

function itemPaloteo(paloteo: PaloteoDemo): FeedItem {
  return {
    id: paloteo.id,
    hora: horaCorta(paloteo.hora),
    orden: Date.parse(paloteo.hora),
    nombre: paloteo.nombreInvitado?.trim() || 'Invitado sin nombre',
    detalle: `Zona · ${paloteo.zonaId}`,
    valido: true,
    promotorNombre: paloteo.promotorNombre,
  };
}

export function CheckinLive() {
  const [paloteos, setPaloteos] = useState<PaloteoDemo[]>([]);

  useEffect(() => {
    setPaloteos(listarPaloteosDemo());
  }, []);

  const feed = useMemo<FeedItem[]>(() => {
    const validaciones: FeedItem[] = CHECKINS_DEMO.map((checkin, indice) => ({
      id: `checkin-${indice}`,
      hora: checkin.hora,
      orden: -(indice + 1),
      nombre: checkin.nombre,
      detalle: checkin.tipo,
      valido: checkin.valido,
    }));

    return [...paloteos.map(itemPaloteo), ...validaciones].sort((a, b) => b.orden - a.orden);
  }, [paloteos]);

  function agregarPaloteo(paloteo: PaloteoDemo) {
    setPaloteos((actuales) => [...actuales, paloteo]);
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
          <QrCode className="size-5 text-lavender" weight="duotone" /> Últimas validaciones
        </h2>
        <PaloteoRegistrar onRegistrado={agregarPaloteo} />
      </div>

      <Card className="overflow-hidden p-0">
        {feed.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-3.5 border-b px-4 py-3 last:border-b-0"
          >
            {item.promotorNombre ? (
              <UsersThree className="size-5 shrink-0 text-warning" weight="duotone" />
            ) : item.valido ? (
              <CheckCircle className="size-5 shrink-0 text-success" weight="duotone" />
            ) : (
              <XCircle className="size-5 shrink-0 text-destructive" weight="duotone" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${item.valido ? '' : 'text-destructive'}`}>
                {item.nombre}
              </p>
              <p className="text-xs text-muted-foreground">{item.detalle}</p>
            </div>
            {item.promotorNombre ? (
              <Badge variant="warning">Paloteo · {item.promotorNombre}</Badge>
            ) : null}
            <span className="font-mono text-xs text-muted-foreground">{item.hora}</span>
          </div>
        ))}
      </Card>
    </section>
  );
}
