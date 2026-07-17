'use client';

import { CheckCircle, LinkBreak, Ticket } from '@phosphor-icons/react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Skeleton,
} from '@urnight/ui';
import { EmptyState } from '@/components/shared/empty-state';
import {
  emitirCodigoInvitadoDemo,
  listarCodigosInvitadoDemo,
  PROMOTOR_LINK_DEMO,
  type CodigoInvitadoDemo,
} from '@/lib/mock/invitados';
import { leerPoliticaDemo, type PoliticaLocalDemo } from '@/lib/mock/politica';

const LOCAL_SLUG = 'nocturna-club';
const EVENTO_ID = 'noche-de-amatista';
const QR_SIZE = 15;

function esModuloBuscador(fila: number, columna: number): boolean {
  const enBloque = (origenFila: number, origenColumna: number) =>
    fila >= origenFila &&
    fila < origenFila + 5 &&
    columna >= origenColumna &&
    columna < origenColumna + 5 &&
    (fila === origenFila ||
      fila === origenFila + 4 ||
      columna === origenColumna ||
      columna === origenColumna + 4 ||
      (fila >= origenFila + 2 && fila <= origenFila + 2 && columna >= origenColumna + 2));

  return enBloque(0, 0) || enBloque(0, QR_SIZE - 5) || enBloque(QR_SIZE - 5, 0);
}

function PseudoQr({ codigo }: { codigo: string }) {
  const semilla = [...codigo].reduce((total, caracter) => total + caracter.charCodeAt(0), 0);

  return (
    <div
      className="grid size-40 grid-cols-[repeat(15,minmax(0,1fr))] gap-0.5 rounded-md bg-white p-3"
      aria-hidden="true"
    >
      {Array.from({ length: QR_SIZE * QR_SIZE }, (_, indice) => {
        const fila = Math.floor(indice / QR_SIZE);
        const columna = indice % QR_SIZE;
        const marcado = esModuloBuscador(fila, columna) || (indice * 7 + semilla + fila) % 5 < 2;
        return <span key={indice} className={marcado ? 'bg-black' : 'bg-transparent'} />;
      })}
    </div>
  );
}

export function InvitadoLanding({ codigo }: { codigo: string }) {
  const [nombre, setNombre] = useState('');
  const [politica, setPolitica] = useState<PoliticaLocalDemo | null>(null);
  const [emitidos, setEmitidos] = useState<CodigoInvitadoDemo[]>([]);
  const [codigoEmitido, setCodigoEmitido] = useState<CodigoInvitadoDemo | null>(null);
  const [listo, setListo] = useState(false);
  const linkValido = codigo === PROMOTOR_LINK_DEMO.code && PROMOTOR_LINK_DEMO.isActive;

  useEffect(() => {
    if (linkValido) {
      setPolitica(leerPoliticaDemo(LOCAL_SLUG));
      setEmitidos(listarCodigosInvitadoDemo(codigo));
    }
    setListo(true);
  }, [codigo, linkValido]);

  if (!linkValido) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
        <div className="mb-4 flex justify-center">
          <Badge variant="info">Demo — lista de invitados</Badge>
        </div>
        <EmptyState
          icon={<LinkBreak weight="duotone" />}
          title="Link no válido o vencido"
          description="Pídele al promotor un enlace activo para ingresar a su lista."
        />
      </main>
    );
  }

  if (!listo || !politica) {
    return (
      <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-12 sm:py-16">
        <Skeleton className="mx-auto h-6 w-44 rounded-full" />
        <Skeleton className="h-80 rounded-lg" />
      </main>
    );
  }

  const cupoCompleto = emitidos.length >= politica.cupoCodigosPorPromotor;

  function emitir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;

    const politicaActual = leerPoliticaDemo(LOCAL_SLUG);
    const codigosActuales = listarCodigosInvitadoDemo(codigo);
    if (codigosActuales.length >= politicaActual.cupoCodigosPorPromotor) {
      setPolitica(politicaActual);
      setEmitidos(codigosActuales);
      return;
    }

    const zonaId =
      [...politicaActual.zonas]
        .sort((a, b) => a.orden - b.orden)
        .find((zona) => zona.activa)?.id ?? 'general';
    const emitido = emitirCodigoInvitadoDemo(nombreLimpio, codigo, EVENTO_ID, zonaId);
    setCodigoEmitido(emitido);
    setEmitidos([...codigosActuales, emitido]);
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:py-14">
      <div className="mb-4 flex justify-center">
        <Badge variant="info">Demo — lista de invitados</Badge>
      </div>

      {cupoCompleto && !codigoEmitido ? (
        <EmptyState
          icon={<Ticket weight="duotone" />}
          title="Cupo de invitados completo"
          description="Este promotor ya emitió todos los códigos disponibles para el evento."
        />
      ) : codigoEmitido ? (
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-xl border border-success-border bg-success-soft text-success">
              <CheckCircle className="size-7" weight="duotone" />
            </div>
            <CardTitle>Ya estás en la lista</CardTitle>
            <CardDescription>
              Guarda este código. Está emitido a nombre de {codigoEmitido.nombreInvitado}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <p className="w-full rounded-md border border-accent-border bg-accent px-5 py-4 font-mono text-2xl font-bold tracking-[0.2em] text-lavender sm:text-3xl">
              {codigoEmitido.codigo}
            </p>
            <div className="mt-6">
              <PseudoQr codigo={codigoEmitido.codigo} />
            </div>
            <p className="mt-5 font-heading text-lg font-bold">Preséntalo en puerta</p>
            <p className="mt-1 text-sm text-muted-foreground">
              El equipo del local validará tu código al llegar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <p className="un-eyebrow text-lavender">Invitación de promotor</p>
            <CardTitle className="text-2xl">
              {PROMOTOR_LINK_DEMO.promotorNombre} te invita a la lista
            </CardTitle>
            <CardDescription>Registra tu nombre y recibe tu código personal de ingreso.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={emitir}>
              <div className="space-y-2">
                <Label htmlFor="nombre-invitado">Nombre completo</Label>
                <Input
                  id="nombre-invitado"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  placeholder="Ej. Valeria Cruz"
                  autoComplete="name"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Obtener mi código
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Quedan {Math.max(0, politica.cupoCodigosPorPromotor - emitidos.length)} códigos
                disponibles.
              </p>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
