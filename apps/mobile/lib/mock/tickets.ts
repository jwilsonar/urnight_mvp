/**
 * DATOS DEMO — entradas del asistente con su QR único. El payload imita el
 * formato del ticketing real (packages/contracts): con backend, esto sale de
 * GET /tickets/me y el QR se valida en puerta con apps/validator.
 */

export type TicketEstadoDemo = 'valid' | 'used';

export const TICKET_ESTADO_LABEL: Record<TicketEstadoDemo, string> = {
  valid: 'Válida',
  used: 'Validada en puerta',
};

export interface TicketDemo {
  id: string;
  evento: string;
  local: string;
  localSlug: string;
  fechaLabel: string;
  horaLabel: string;
  tipo: string;
  estado: TicketEstadoDemo;
  asistente: string;
  /** Contenido del QR único (opaco para el usuario; lo lee el validador). */
  qrPayload: string;
  imageUrl: string;
}

export const TICKETS_DEMO: TicketDemo[] = [
  {
    id: 't1',
    evento: 'Reggaetón Old School',
    local: 'Nocturna Club',
    localSlug: 'nocturna-club',
    fechaLabel: 'Sáb 18 Jul',
    horaLabel: '10:00 PM',
    tipo: 'Entrada gratuita · Código promotor',
    estado: 'valid',
    asistente: 'Piero Pérez',
    qrPayload: 'URNIGHT|t1|e1|DEMO-7f3a9c1e-4b2d-4e8a-9c5f-demo000001',
    imageUrl: 'https://picsum.photos/seed/app-oldschool/800/1000',
  },
  {
    id: 't2',
    evento: 'Sunset Rooftop Sessions',
    local: 'Sky Lounge 360',
    localSlug: 'sky-lounge-360',
    fechaLabel: 'Vie 17 Jul',
    horaLabel: '6:00 PM',
    tipo: 'General',
    estado: 'used',
    asistente: 'Piero Pérez',
    qrPayload: 'URNIGHT|t2|e2|DEMO-2c8b4f6a-1d3e-4a7b-8e9c-demo000002',
    imageUrl: 'https://picsum.photos/seed/app-sunset/800/1000',
  },
];
