'use client';

import { CheckCircle, Copy, Ticket, UsersThree } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@urnight/ui';
import { EmptyState } from '@/components/shared/empty-state';
import {
  listarCodigosInvitadoDemo,
  PROMOTOR_LINK_DEMO,
  type CodigoInvitadoDemo,
} from '@/lib/mock/invitados';
import { leerPoliticaDemo } from '@/lib/mock/politica';

const LOCAL_SLUG = 'nocturna-club';
const LINK_INVITADOS = `/invitado/${PROMOTOR_LINK_DEMO.code}`;

const ESTADO_BADGE = {
  emitido: { label: 'Emitido', variant: 'info' },
  usado: { label: 'Usado', variant: 'success' },
  expirado: { label: 'Expirado', variant: 'secondary' },
} as const;

export function LinkInvitadosCard() {
  const [copiado, setCopiado] = useState(false);
  const [codigos, setCodigos] = useState<CodigoInvitadoDemo[]>([]);
  const [cupo, setCupo] = useState(0);

  useEffect(() => {
    function cargar() {
      setCodigos(listarCodigosInvitadoDemo(PROMOTOR_LINK_DEMO.code));
      setCupo(leerPoliticaDemo(LOCAL_SLUG).cupoCodigosPorPromotor);
    }

    cargar();
    window.addEventListener('focus', cargar);
    window.addEventListener('storage', cargar);
    return () => {
      window.removeEventListener('focus', cargar);
      window.removeEventListener('storage', cargar);
    };
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(new URL(LINK_INVITADOS, window.location.origin).toString());
      setCopiado(true);
      toast.success('Link de invitados copiado');
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error('No pudimos copiar el link de invitados.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <UsersThree className="size-5 text-lavender" weight="duotone" />
          <CardTitle>Tu lista de invitados</CardTitle>
          <Badge variant="info" className="ml-auto">
            Demo — self-serve
          </Badge>
        </div>
        <CardDescription>
          Comparte este link para que cada invitado genere su propio código de puerta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex gap-2">
          <Input
            readOnly
            value={LINK_INVITADOS}
            aria-label="Link de lista de invitados"
            className="font-mono text-sm"
          />
          <Button type="button" variant="outline" size="icon" onClick={copiar} aria-label="Copiar link">
            {copiado ? (
              <CheckCircle className="text-success" weight="duotone" />
            ) : (
              <Copy weight="duotone" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 border-y py-3">
          <span className="text-sm font-semibold">Códigos de este evento</span>
          <span className="font-mono text-sm font-bold text-lavender">
            emitidos {codigos.length} / cupo {cupo}
          </span>
        </div>

        {codigos.length === 0 ? (
          <EmptyState
            compact
            icon={<Ticket weight="duotone" />}
            title="Aún no hay códigos emitidos"
            description="Los invitados aparecerán aquí cuando usen tu link."
          />
        ) : (
          <div className="divide-y rounded-md border">
            {[...codigos].reverse().map((item) => {
              const estado = ESTADO_BADGE[item.estado];
              return (
                <div key={item.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
                  <span className="font-mono text-sm font-bold text-lavender">{item.codigo}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{item.nombreInvitado}</span>
                  <Badge variant={estado.variant}>{estado.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
