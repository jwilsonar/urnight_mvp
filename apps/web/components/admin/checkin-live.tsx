'use client';

import {
  CheckCircle,
  MagnifyingGlass,
  QrCode,
  UsersThree,
  XCircle,
} from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Card, Input } from '@urnight/ui';
import { BoxesPuerta } from '@/components/admin/boxes-puerta';
import { PaloteoRegistrar } from '@/components/admin/paloteo-registrar';
import {
  documentoEnmascarado,
  listarPaloteosDemo,
  type PaloteoDemo,
} from '@/lib/mock/paloteo';
import { CHECKINS_DEMO } from '@/lib/mock/paneles';
import {
  etiquetaPulsera,
  leerPoliticaDemo,
  type ZonaLocalDemo,
} from '@/lib/mock/politica';

const LOCAL_SLUG = 'nocturna-club';

interface FeedItem {
  id: string;
  hora: string;
  orden: number;
  nombre: string;
  detalle: string;
  valido: boolean;
  documento?: string;
  zona?: ZonaLocalDemo;
  promotorNombre?: string;
}

function nombreZona(zonaId: string): string {
  return zonaId
    .split('-')
    .map((parte) => (parte.toLowerCase() === 'vip' ? 'VIP' : parte.charAt(0).toUpperCase() + parte.slice(1)))
    .join(' ');
}

function horaCorta(fechaIso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(fechaIso));
}

function textoComparable(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-PE')
    .trim();
}

function documentoComparable(valor: string): string {
  return textoComparable(valor).replace(/[^a-z0-9]/g, '');
}

function itemPaloteo(paloteo: PaloteoDemo, zona?: ZonaLocalDemo): FeedItem {
  const zonaNombre = zona?.nombre ?? nombreZona(paloteo.zonaId);

  return {
    id: paloteo.id,
    hora: horaCorta(paloteo.hora),
    orden: Date.parse(paloteo.hora),
    nombre: paloteo.nombreInvitado?.trim() || 'Invitado sin nombre',
    detalle:
      paloteo.cantidad > 1
        ? `${paloteo.cantidad} personas · ${zonaNombre}`
        : `Zona · ${zonaNombre}`,
    valido: true,
    ...(paloteo.documento ? { documento: paloteo.documento } : {}),
    ...(zona ? { zona } : {}),
    promotorNombre: paloteo.promotorNombre,
  };
}

function PulseraChip({ zona }: { zona: ZonaLocalDemo }) {
  const etiqueta = etiquetaPulsera(zona);

  return (
    <span
      className="inline-flex min-h-8 items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm font-bold shadow-sm"
      aria-label={`Pulsera ${etiqueta}`}
    >
      <span
        className="size-3 shrink-0 rounded-full border border-black/15"
        style={{ backgroundColor: zona.color }}
        aria-hidden="true"
      />
      Pulsera: {etiqueta}
    </span>
  );
}

export function CheckinLive() {
  const [paloteos, setPaloteos] = useState<PaloteoDemo[]>([]);
  const [zonas, setZonas] = useState<ZonaLocalDemo[]>([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    setPaloteos(listarPaloteosDemo());
    setZonas(leerPoliticaDemo(LOCAL_SLUG).zonas);
  }, []);

  const zonasPorId = useMemo(
    () => new Map(zonas.map((zona) => [zona.id, zona])),
    [zonas],
  );

  const feed = useMemo<FeedItem[]>(() => {
    const validaciones: FeedItem[] = CHECKINS_DEMO.map((checkin, indice) => ({
      id: `checkin-${indice}`,
      hora: checkin.hora,
      orden: -(indice + 1),
      nombre: checkin.nombre,
      detalle: checkin.tipo,
      valido: checkin.valido,
      ...(checkin.documento ? { documento: checkin.documento } : {}),
      ...(zonasPorId.get(checkin.zonaId)
        ? { zona: zonasPorId.get(checkin.zonaId) }
        : {}),
    }));

    const ingresosPaloteo = paloteos.map((paloteo) =>
      itemPaloteo(paloteo, zonasPorId.get(paloteo.zonaId)),
    );

    return [...ingresosPaloteo, ...validaciones].sort((a, b) => b.orden - a.orden);
  }, [paloteos, zonasPorId]);

  const consultaTexto = textoComparable(busqueda);
  const buscando = consultaTexto.length > 0;
  const feedFiltrado = useMemo(() => {
    if (!consultaTexto) return feed;

    const consultaDocumento = documentoComparable(busqueda);
    return feed.filter((item) => {
      const coincideNombre = textoComparable(item.nombre).includes(consultaTexto);
      const coincideDocumento =
        consultaDocumento.length > 0 &&
        Boolean(
          item.documento && documentoComparable(item.documento).endsWith(consultaDocumento),
        );

      return coincideNombre || coincideDocumento;
    });
  }, [busqueda, consultaTexto, feed]);

  const totalPersonasPaloteo = useMemo(
    () => paloteos.reduce((total, paloteo) => total + paloteo.cantidad, 0),
    [paloteos],
  );

  function agregarPaloteo(paloteo: PaloteoDemo) {
    setPaloteos((actuales) => [...actuales, paloteo]);
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
          <QrCode className="size-5 text-rose" weight="duotone" /> Últimas validaciones
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant="info">
            {totalPersonasPaloteo} {totalPersonasPaloteo === 1 ? 'persona por paloteo' : 'personas por paloteo'}
          </Badge>
          <PaloteoRegistrar onRegistrado={agregarPaloteo} />
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <MagnifyingGlass
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre o documento"
            aria-label="Buscar por nombre o documento"
            autoComplete="off"
            className="h-11 pl-10"
          />
        </div>
        <p className="shrink-0 text-sm text-muted-foreground" aria-live="polite">
          {buscando
            ? `${feedFiltrado.length} ${feedFiltrado.length === 1 ? 'resultado' : 'resultados'} de ${feed.length}`
            : `${feed.length} registros recientes`}
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        {feedFiltrado.length === 0 ? (
          <div className="px-4 py-8 text-center" role="status">
            <p className="font-semibold">
              {buscando
                ? 'Nadie coincide con esa búsqueda'
                : 'Todavía no hay ingresos registrados'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {buscando
                ? 'Prueba con otro nombre o con los últimos dígitos del documento.'
                : 'Las validaciones aparecerán aquí en tiempo real.'}
            </p>
          </div>
        ) : (
          feedFiltrado.map((item) => {
            const documento = documentoEnmascarado(item.documento);

            return (
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
                <div className="min-w-0 flex-1 basis-52">
                  <p
                    className={`text-sm font-semibold ${item.valido ? '' : 'text-destructive'}`}
                  >
                    {item.nombre}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs text-muted-foreground">{item.detalle}</span>
                    {documento ? (
                      <span className="font-mono text-xs font-semibold text-muted-foreground">
                        Doc. {documento}
                      </span>
                    ) : null}
                  </div>
                  {item.valido && item.zona ? (
                    <div className="mt-2">
                      <PulseraChip zona={item.zona} />
                    </div>
                  ) : null}
                </div>
                {item.promotorNombre ? (
                  <Badge variant="warning">Paloteo · {item.promotorNombre}</Badge>
                ) : null}
                <span className="font-mono text-xs text-muted-foreground">{item.hora}</span>
              </div>
            );
          })
        )}
      </Card>

      <div className="mt-8">
        <BoxesPuerta />
      </div>
    </section>
  );
}
