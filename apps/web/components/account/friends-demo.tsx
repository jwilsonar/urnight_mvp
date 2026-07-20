'use client';

import { useMemo, useState } from 'react';
import { Badge, Button, Card, Input, Label } from '@urnight/ui';
import { AMIGOS_DEMO, SOLICITUDES_DEMO } from '@/lib/mock/social';

const NIVEL_VARIANT = {
  Bronce: 'secondary',
  Plata: 'outline',
  Oro: 'warning',
  Diamante: 'info',
} as const;

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .map((parte) => parte.charAt(0))
    .slice(0, 2)
    .join('');
}

export function FriendsDemo() {
  const [busqueda, setBusqueda] = useState('');
  const [solicitudes, setSolicitudes] = useState(SOLICITUDES_DEMO);
  const amigos = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es-PE');
    if (!termino) return AMIGOS_DEMO;
    return AMIGOS_DEMO.filter((amigo) =>
      amigo.nombre.toLocaleLowerCase('es-PE').includes(termino),
    );
  }, [busqueda]);

  function quitarSolicitud(id: string) {
    // Aceptar e ignorar comparten el cierre visual porque ninguna acción persiste en la demo.
    setSolicitudes((actuales) => actuales.filter((solicitud) => solicitud.id !== id));
  }

  return (
    <div className="space-y-8">
      {solicitudes.length > 0 ? (
        <section>
          <h2 className="font-heading text-xl font-extrabold">Solicitudes</h2>
          <Card className="mt-4 overflow-hidden p-0">
            {solicitudes.map((solicitud) => (
              <div
                key={solicitud.id}
                className="flex flex-wrap items-center gap-3 border-b px-4 py-3.5 last:border-b-0"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-accent-border bg-accent-soft text-sm font-bold text-rose">
                  {iniciales(solicitud.nombre)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{solicitud.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {solicitud.mutuos} amigos en común
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => quitarSolicitud(solicitud.id)}>
                    Aceptar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => quitarSolicitud(solicitud.id)}
                  >
                    Ignorar
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </section>
      ) : null}

      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-extrabold">Tus amigos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Personas con las que compartiste una noche RAVENUE.
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <Label htmlFor="buscar-amigo">Buscar por nombre</Label>
            <Input
              id="buscar-amigo"
              type="search"
              className="mt-2"
              placeholder="Ej. Valentina"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>
        </div>

        {amigos.length > 0 ? (
          <Card className="mt-4 overflow-hidden p-0">
            {amigos.map((amigo) => (
              <div
                key={amigo.id}
                className="flex items-center gap-3.5 border-b px-4 py-4 last:border-b-0"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-accent-border bg-accent-soft text-sm font-bold text-rose">
                  {iniciales(amigo.nombre)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold">{amigo.nombre}</p>
                    <Badge variant={NIVEL_VARIANT[amigo.nivel as keyof typeof NIVEL_VARIANT]}>
                      {amigo.nivel}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Última noche: {amigo.ultimaNoche}
                  </p>
                </div>
                <span className="text-right text-xs font-semibold text-muted-foreground">
                  {amigo.eventosJuntos} eventos juntos
                </span>
              </div>
            ))}
          </Card>
        ) : (
          <Card className="mt-4 p-6 text-center text-sm text-muted-foreground" role="status">
            No encontramos amigos con ese nombre.
          </Card>
        )}
      </section>
    </div>
  );
}
