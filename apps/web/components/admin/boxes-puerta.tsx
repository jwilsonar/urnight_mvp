'use client';

import {
  CaretDown,
  CaretUp,
  CheckCircle,
  MagnifyingGlass,
  QrCode,
} from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Input } from '@urnight/ui';
import { documentoEnmascarado } from '@/lib/mock/paloteo';
import {
  etiquetaPulsera,
  leerPoliticaDemo,
  POLITICA_DEFAULT,
  type ZonaLocalDemo,
} from '@/lib/mock/politica';
import {
  listarReservasLocalDemo,
  marcarPaseReservaUsadoDemo,
  RESERVAS_LOCAL_DEMO,
  type ReservaLocalDemo,
} from '@/lib/mock/reservas';

const LOCAL_SLUG = 'nocturna-club';

function textoComparable(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-PE')
    .trim();
}

function codigoComparable(valor: string): string {
  return textoComparable(valor).replace(/[^a-z0-9]/g, '');
}

function nombreZona(zonaId: string): string {
  return zonaId
    .split('-')
    .map((parte) =>
      parte.toLowerCase() === 'vip'
        ? 'VIP'
        : parte.charAt(0).toUpperCase() + parte.slice(1),
    )
    .join(' ');
}

function zonaFallback(zonaId: string): ZonaLocalDemo {
  return {
    id: zonaId,
    nombre: nombreZona(zonaId),
    orden: 0,
    color: '#E31732',
    activa: true,
  };
}

function EstadoReserva({ estado }: { estado: ReservaLocalDemo['estado'] }) {
  if (estado === 'confirmada') return <Badge variant="success">Confirmada</Badge>;
  if (estado === 'pendiente') return <Badge variant="warning">Pendiente</Badge>;
  return <Badge variant="secondary">Completada</Badge>;
}

function PulseraBox({ zona }: { zona: ZonaLocalDemo }) {
  const etiqueta = etiquetaPulsera(zona);

  return (
    <div className="inline-flex min-h-9 items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm font-bold shadow-sm">
      <span
        className="size-3 shrink-0 rounded-full border border-black/15"
        style={{ backgroundColor: zona.color }}
        aria-hidden="true"
      />
      Pulsera: {etiqueta}
    </div>
  );
}

export function BoxesPuerta() {
  const [reservas, setReservas] = useState<ReservaLocalDemo[]>(RESERVAS_LOCAL_DEMO);
  const [zonas, setZonas] = useState<ZonaLocalDemo[]>(POLITICA_DEFAULT.zonas);
  const [busqueda, setBusqueda] = useState('');
  const [reservaExpandida, setReservaExpandida] = useState<string | null>(null);

  useEffect(() => {
    setReservas(listarReservasLocalDemo());
    setZonas(leerPoliticaDemo(LOCAL_SLUG).zonas);
  }, []);

  const zonasPorId = useMemo(
    () => new Map(zonas.map((zona) => [zona.id, zona])),
    [zonas],
  );

  const consultaTexto = textoComparable(busqueda);
  const consultaCodigo = codigoComparable(busqueda);
  const buscando = consultaTexto.length > 0;
  const reservasFiltradas = useMemo(() => {
    if (!consultaTexto) return reservas;

    return reservas.filter((reserva) => {
      const coincideTitular = textoComparable(reserva.titular).includes(consultaTexto);
      const codigo = textoComparable(reserva.codigo);
      const coincideCodigo =
        codigo.includes(consultaTexto) ||
        (consultaCodigo.length > 0 &&
          codigoComparable(reserva.codigo).endsWith(consultaCodigo));

      return coincideTitular || coincideCodigo;
    });
  }, [consultaCodigo, consultaTexto, reservas]);

  const boxesLlegados = useMemo(
    () =>
      reservas.filter((reserva) =>
        reserva.pases.some((pase) => pase.estado === 'usado'),
      ).length,
    [reservas],
  );

  function marcarIngreso(reservaId: string, paseId: string) {
    setReservas(marcarPaseReservaUsadoDemo(reservaId, paseId));
  }

  return (
    <section aria-labelledby="boxes-puerta-title">
      <Card className="overflow-hidden p-0">
        <div className="border-b px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="boxes-puerta-title"
              className="flex items-center gap-2 font-heading text-lg font-bold"
            >
              <QrCode className="size-5 text-rose" weight="duotone" />
              Boxes de la noche
            </h2>
            <div className="flex flex-wrap items-center gap-2" aria-live="polite">
              <Badge variant="info">
                {reservas.length} {reservas.length === 1 ? 'box' : 'boxes'}
              </Badge>
              <Badge variant="success">
                {boxesLlegados} {boxesLlegados === 1 ? 'ya llegó' : 'ya llegaron'}
              </Badge>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <MagnifyingGlass
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por titular o código RV-"
                aria-label="Buscar box por titular o código de reserva"
                autoComplete="off"
                className="h-11 pl-10"
              />
            </div>
            <p className="shrink-0 text-sm text-muted-foreground" aria-live="polite">
              {buscando
                ? `${reservasFiltradas.length} ${reservasFiltradas.length === 1 ? 'resultado' : 'resultados'} de ${reservas.length}`
                : 'Busca por nombre o por los últimos caracteres'}
            </p>
          </div>
        </div>

        {reservasFiltradas.length === 0 ? (
          <div className="px-4 py-8 text-center" role="status">
            <p className="font-semibold">No encontramos ese box</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Prueba con el titular, el código RV- o sus últimos caracteres.
            </p>
          </div>
        ) : (
          reservasFiltradas.map((reserva) => {
            const expandida = reservaExpandida === reserva.id;
            const zona = zonasPorId.get(reserva.zonaId) ?? zonaFallback(reserva.zonaId);
            const usados = reserva.pases.filter((pase) => pase.estado === 'usado').length;
            const documento = documentoEnmascarado(reserva.documento);
            const detalleId = `box-detalle-${reserva.id}`;

            return (
              <article key={reserva.id} className="border-b last:border-b-0">
                <button
                  type="button"
                  className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
                  aria-expanded={expandida}
                  aria-controls={detalleId}
                  onClick={() => setReservaExpandida(expandida ? null : reserva.id)}
                >
                  <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1 basis-52">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 shrink-0 rounded-full border border-black/15"
                          style={{ backgroundColor: zona.color }}
                          aria-hidden="true"
                        />
                        <h3 className="truncate font-heading font-bold">{reserva.mesa}</h3>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {zona.nombre}
                        {reserva.llegada ? ` · Llegada ${reserva.llegada}` : ''}
                      </p>
                    </div>

                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate text-sm font-semibold">{reserva.titular}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{reserva.pax} personas</span>
                        {documento ? (
                          <span className="font-mono font-semibold">Doc. {documento}</span>
                        ) : null}
                        <span className="font-mono font-semibold">{reserva.codigo}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <EstadoReserva estado={reserva.estado} />
                      <Badge variant={usados === reserva.pases.length ? 'success' : 'outline'}>
                        {usados} de {reserva.pases.length} usados
                      </Badge>
                    </div>
                  </div>

                  {expandida ? (
                    <CaretUp className="size-5 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <CaretDown className="size-5 text-muted-foreground" aria-hidden="true" />
                  )}
                </button>

                {expandida ? (
                  <div id={detalleId} className="border-t bg-muted/25 px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">Pases del box</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Coteja la identidad antes de registrar cada ingreso.
                        </p>
                      </div>
                      <PulseraBox zona={zona} />
                    </div>

                    <ul className="mt-4 grid gap-2">
                      {reserva.pases.map((pase) => {
                        const nombre = pase.titular.trim() || 'Invitado sin nombre';
                        const esTitular =
                          textoComparable(nombre) === textoComparable(reserva.titular);

                        return (
                          <li
                            key={pase.id}
                            className="flex min-w-0 flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{nombre}</p>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span className="font-mono font-semibold">{pase.codigo}</span>
                                <span>Pase {pase.indice}</span>
                                {/* El documento completo solo aparece en el pase del titular que se coteja. */}
                                {esTitular && reserva.documento ? (
                                  <span className="font-mono font-semibold text-foreground">
                                    DNI {reserva.documento}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {pase.estado === 'usado' ? (
                              <Badge variant="success">
                                <CheckCircle className="size-3.5" weight="fill" />
                                Usado
                              </Badge>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => marcarIngreso(reserva.id, pase.id)}
                              >
                                Marcar ingreso
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </Card>
    </section>
  );
}
