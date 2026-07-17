/**
 * DATOS DEMO — códigos de invitado emitidos por promotores.
 * Este módulo se reemplazará por fetchers de lib/api/ cuando exista el backend;
 * los nombres camelCase ya están alineados a los contratos futuros.
 */

export interface CodigoInvitadoDemo {
  id: string;
  codigo: string;
  nombreInvitado: string;
  promotorCodigo: string;
  eventoId: string;
  zonaId: string;
  estado: 'emitido' | 'usado' | 'expirado';
  emitidoEn: string;
}

export interface PromotorLinkDemo {
  code: string;
  url: string;
  clicks: number;
  isActive: boolean;
  promotorNombre: string;
}

export const PROMOTOR_LINK_DEMO: PromotorLinkDemo = {
  code: 'ANDREA10',
  url: 'https://urnight.pe/r/ANDREA10',
  clicks: 154,
  isActive: true,
  promotorNombre: 'Andrea',
};

const ALFANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function sufijoAleatorio(): string {
  return Array.from({ length: 6 }, () =>
    ALFANUM.charAt(Math.floor(Math.random() * ALFANUM.length)),
  ).join('');
}

function invitadosKey(promotorCodigo: string): string {
  return `urnight.invitados.${promotorCodigo}`;
}

function guardarCodigosInvitadoDemo(
  promotorCodigo: string,
  codigos: CodigoInvitadoDemo[],
): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(invitadosKey(promotorCodigo), JSON.stringify(codigos));
  } catch {
    /* storage bloqueado: el código emitido queda solo en memoria del consumidor */
  }
}

export function emitirCodigoInvitadoDemo(
  nombre: string,
  promotorCodigo: string,
  eventoId: string,
  zonaId: string,
): CodigoInvitadoDemo {
  const sufijo = sufijoAleatorio();
  const codigo: CodigoInvitadoDemo = {
    id: `invitado-${Date.now()}-${sufijo.toLowerCase()}`,
    codigo: `INV-${sufijo}`,
    nombreInvitado: nombre,
    promotorCodigo,
    eventoId,
    zonaId,
    estado: 'emitido',
    emitidoEn: new Date().toISOString(),
  };

  guardarCodigosInvitadoDemo(promotorCodigo, [
    ...listarCodigosInvitadoDemo(promotorCodigo),
    codigo,
  ]);
  return codigo;
}

export function listarCodigosInvitadoDemo(promotorCodigo: string): CodigoInvitadoDemo[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(invitadosKey(promotorCodigo));
    return raw ? (JSON.parse(raw) as CodigoInvitadoDemo[]) : [];
  } catch {
    return [];
  }
}
