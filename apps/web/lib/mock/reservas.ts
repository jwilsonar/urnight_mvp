/**
 * DATOS DEMO — flujo de reserva de mesas (R1–R5 del prototipo v3).
 * Este módulo es intencionalmente mock: el backend de reservas aún no existe.
 * Cuando exista, este archivo se reemplaza por fetchers en lib/api/.
 */

export interface MesaDemo {
  id: string;
  label: string;
  zone: 'Pista' | 'VIP' | 'Lounge';
  zonaId?: string;
  cap: number;
  min: number;
  deposit: number;
  status: 'available' | 'reserved';
  hot?: string;
  /** Posición en el plano SVG (viewBox 600×400). */
  layout: { x: number; y: number; w: number; h: number };
}

export interface PaseReservaDemo {
  id: string;
  codigo: string;
  reservaId: string;
  zonaId: string;
  titular: string;
  indice: number;
  estado: 'activo' | 'usado';
}

export interface DesgloseReservaDemo {
  adelanto: number;
  creditoConsumo: number;
  comisionServicio: number;
}

export interface BotellaDemo {
  id: string;
  name: string;
  brand: string;
  price: number;
  promo?: string;
}

export const MESAS_DEMO: MesaDemo[] = [
  { id: 'm1', label: 'Mesa 04 · Pista', zone: 'Pista', zonaId: 'general', cap: 4, min: 200, deposit: 200, status: 'available', layout: { x: 50, y: 70, w: 60, h: 55 } },
  { id: 'm2', label: 'Mesa 07 · Pista', zone: 'Pista', zonaId: 'general', cap: 4, min: 200, deposit: 200, status: 'available', layout: { x: 130, y: 70, w: 60, h: 55 } },
  { id: 'm3', label: 'Box VIP 01', zone: 'VIP', zonaId: 'vip', cap: 8, min: 600, deposit: 400, status: 'available', hot: 'Pocas', layout: { x: 340, y: 70, w: 90, h: 55 } },
  { id: 'm4', label: 'Box VIP 02', zone: 'VIP', zonaId: 'vip', cap: 8, min: 600, deposit: 400, status: 'reserved', layout: { x: 450, y: 70, w: 90, h: 55 } },
  { id: 'm5', label: 'Lounge Premium', zone: 'Lounge', zonaId: 'super-vip', cap: 12, min: 1500, deposit: 800, status: 'available', hot: 'Pocas', layout: { x: 50, y: 260, w: 180, h: 90 } },
  { id: 'm6', label: 'Box VIP 03', zone: 'VIP', zonaId: 'vip', cap: 8, min: 600, deposit: 400, status: 'reserved', layout: { x: 340, y: 140, w: 90, h: 55 } },
  { id: 'm7', label: 'Mesa 11 · Pista', zone: 'Pista', zonaId: 'general', cap: 4, min: 200, deposit: 200, status: 'available', layout: { x: 50, y: 140, w: 60, h: 55 } },
  { id: 'm8', label: 'Mesa 12 · Pista', zone: 'Pista', zonaId: 'general', cap: 4, min: 200, deposit: 200, status: 'reserved', layout: { x: 130, y: 140, w: 60, h: 55 } },
];

export const BOTELLAS_DEMO: BotellaDemo[] = [
  { id: 'b1', name: 'Johnnie Walker Black', brand: 'Whisky', price: 280, promo: '-15% en preventa' },
  { id: 'b2', name: 'Absolut Original', brand: 'Vodka', price: 220, promo: '-10% en preventa' },
  { id: 'b3', name: 'Don Julio Reposado', brand: 'Tequila', price: 320 },
  { id: 'b4', name: 'Moët & Chandon Brut', brand: 'Champagne', price: 480, promo: 'Botella + 2 mixers' },
  { id: 'b5', name: 'Bombay Sapphire', brand: 'Gin', price: 240 },
  { id: 'b6', name: 'Red Bull (pack 4)', brand: 'Energizante', price: 48 },
];

export const EVENTO_DEMO = {
  title: 'Noche de Amatista',
  date: 'Sáb 19 Abr',
  time: '11:00 PM',
  venue: 'Nocturna Club · Miraflores',
};

export const LLEGADAS_DEMO = ['10:30 PM', '11:00 PM', '11:30 PM', '12:00 AM', '12:30 AM', '01:00 AM'];

/** Mis reservas (pantalla R6 del prototipo). Demo hasta tener backend. */
export interface ReservaHechaDemo {
  id: string;
  codigo: string;
  evento: string;
  venue: string;
  fecha: string;
  mesa: string;
  pax: number;
  deposito: number;
  estado: 'confirmada' | 'pendiente' | 'completada';
}

export const MIS_RESERVAS_DEMO: ReservaHechaDemo[] = [
  {
    id: 'r1',
    codigo: 'RV-8F4K21',
    evento: 'Noche de Amatista',
    venue: 'Nocturna Club · Miraflores',
    fecha: 'Sáb 19 Abr · 11:00 PM',
    mesa: 'Box VIP 01',
    pax: 6,
    deposito: 400,
    estado: 'confirmada',
  },
  {
    id: 'r2',
    codigo: 'RV-2M9X07',
    evento: 'Deep House Session',
    venue: 'Barranco Beats · Barranco',
    fecha: 'Sáb 26 Abr · 11:30 PM',
    mesa: 'Mesa 07 · Pista',
    pax: 4,
    deposito: 200,
    estado: 'pendiente',
  },
  {
    id: 'r3',
    codigo: 'RV-7Q1B44',
    evento: 'Reggaetón Night',
    venue: 'Nocturna Club · Miraflores',
    fecha: 'Vie 21 Mar · 10:30 PM',
    mesa: 'Lounge Premium',
    pax: 10,
    deposito: 800,
    estado: 'completada',
  },
];

export interface ReservaLocalDemo {
  id: string;
  codigo: string;
  titular: string;
  /** Dato personal: en listados se enmascara y solo se revela al cotejar el pase. */
  documento?: string;
  mesa: string;
  zonaId: string;
  pax: number;
  deposito: number;
  estado: 'confirmada' | 'pendiente' | 'completada';
  llegada?: string;
  pases: PaseReservaDemo[];
}

function paseLocalDemo(
  reservaId: string,
  zonaId: string,
  indice: number,
  codigo: string,
  titular = '',
  estado: PaseReservaDemo['estado'] = 'activo',
): PaseReservaDemo {
  return {
    id: `pase-${reservaId}-${indice}`,
    codigo,
    reservaId,
    zonaId,
    titular,
    indice,
    estado,
  };
}

export const RESERVAS_LOCAL_DEMO: ReservaLocalDemo[] = [
  {
    id: 'reserva-local-1',
    codigo: 'RV-8F4K21',
    titular: 'Laura Mendoza',
    documento: '70456004',
    mesa: 'Box VIP 01',
    zonaId: 'vip',
    pax: 6,
    deposito: 400,
    estado: 'confirmada',
    llegada: '11:00 PM',
    pases: [
      paseLocalDemo('reserva-local-1', 'vip', 1, 'PAS-A1B2C3', 'Laura Mendoza', 'usado'),
      paseLocalDemo('reserva-local-1', 'vip', 2, 'PAS-D4E5F6', 'Diego Torres', 'usado'),
      paseLocalDemo('reserva-local-1', 'vip', 3, 'PAS-G7H8J9', 'Camila Vega', 'usado'),
      paseLocalDemo('reserva-local-1', 'vip', 4, 'PAS-K2L3M4', 'Marco Ruiz'),
      paseLocalDemo('reserva-local-1', 'vip', 5, 'PAS-N5P6Q7', 'Valeria Soto'),
      paseLocalDemo('reserva-local-1', 'vip', 6, 'PAS-R8S9T2', 'Bruno Díaz'),
    ],
  },
  {
    id: 'reserva-local-2',
    codigo: 'RV-6N2C18',
    titular: 'Andrés Salazar',
    documento: '73192818',
    mesa: 'Box VIP 02',
    zonaId: 'vip',
    pax: 5,
    deposito: 400,
    estado: 'pendiente',
    llegada: '11:30 PM',
    pases: [
      paseLocalDemo('reserva-local-2', 'vip', 1, 'PAS-U3V4W5', 'Andrés Salazar'),
      paseLocalDemo('reserva-local-2', 'vip', 2, 'PAS-X6Y7Z8'),
      paseLocalDemo('reserva-local-2', 'vip', 3, 'PAS-B9C2D3'),
      paseLocalDemo('reserva-local-2', 'vip', 4, 'PAS-E4F5G6'),
      paseLocalDemo('reserva-local-2', 'vip', 5, 'PAS-H7J8K9'),
    ],
  },
  {
    id: 'reserva-local-3',
    codigo: 'RV-9P3D52',
    titular: 'Fernanda Rojas',
    documento: '76841352',
    mesa: 'Lounge Premium',
    zonaId: 'super-vip',
    pax: 6,
    deposito: 800,
    estado: 'confirmada',
    llegada: '12:00 AM',
    pases: [
      paseLocalDemo('reserva-local-3', 'super-vip', 1, 'PAS-L2M3N4', 'Fernanda Rojas', 'usado'),
      paseLocalDemo('reserva-local-3', 'super-vip', 2, 'PAS-P5Q6R7', 'Sofía Campos'),
      paseLocalDemo('reserva-local-3', 'super-vip', 3, 'PAS-S8T9U2', 'Luciana Peña'),
      paseLocalDemo('reserva-local-3', 'super-vip', 4, 'PAS-V3W4X5'),
      paseLocalDemo('reserva-local-3', 'super-vip', 5, 'PAS-Y6Z7A8'),
      paseLocalDemo('reserva-local-3', 'super-vip', 6, 'PAS-C9D2E3'),
    ],
  },
  {
    id: 'reserva-local-4',
    codigo: 'RV-4T7M66',
    titular: 'Javier Cruz',
    documento: '71450766',
    mesa: 'Box VIP 03',
    zonaId: 'vip',
    pax: 4,
    deposito: 400,
    estado: 'completada',
    llegada: '10:45 PM',
    pases: [
      paseLocalDemo('reserva-local-4', 'vip', 1, 'PAS-F4G5H6', 'Javier Cruz', 'usado'),
      paseLocalDemo('reserva-local-4', 'vip', 2, 'PAS-J7K8L9', 'Paola León', 'usado'),
      paseLocalDemo('reserva-local-4', 'vip', 3, 'PAS-M2N3P4', 'Renzo Silva', 'usado'),
      paseLocalDemo('reserva-local-4', 'vip', 4, 'PAS-Q5R6S7', 'María Paz', 'usado'),
    ],
  },
];

const RESERVAS_LOCAL_KEY = 'ravenue.reservas-local';

function clonarReservasLocalDemo(
  reservas: ReservaLocalDemo[],
): ReservaLocalDemo[] {
  return reservas.map((reserva) => ({
    ...reserva,
    pases: reserva.pases.map((pase) => ({ ...pase })),
  }));
}

let reservasLocalMemoria = clonarReservasLocalDemo(RESERVAS_LOCAL_DEMO);

function aplicarEstadosPersistidos(valor: unknown): ReservaLocalDemo[] {
  if (!Array.isArray(valor)) return clonarReservasLocalDemo(RESERVAS_LOCAL_DEMO);

  const estados = new Map<string, PaseReservaDemo['estado']>();
  for (const entrada of valor) {
    if (!entrada || typeof entrada !== 'object') continue;

    const candidato = entrada as { id?: unknown; estado?: unknown; pases?: unknown };
    const pases = Array.isArray(candidato.pases) ? candidato.pases : [candidato];
    for (const pase of pases) {
      if (!pase || typeof pase !== 'object') continue;

      const pasePersistido = pase as { id?: unknown; estado?: unknown };
      if (
        typeof pasePersistido.id === 'string' &&
        (pasePersistido.estado === 'activo' || pasePersistido.estado === 'usado')
      ) {
        estados.set(pasePersistido.id, pasePersistido.estado);
      }
    }
  }

  return clonarReservasLocalDemo(RESERVAS_LOCAL_DEMO).map((reserva) => ({
    ...reserva,
    pases: reserva.pases.map((pase) => ({
      ...pase,
      estado: estados.get(pase.id) ?? pase.estado,
    })),
  }));
}

export function listarReservasLocalDemo(): ReservaLocalDemo[] {
  if (typeof window === 'undefined') {
    return clonarReservasLocalDemo(RESERVAS_LOCAL_DEMO);
  }

  try {
    const raw = sessionStorage.getItem(RESERVAS_LOCAL_KEY);
    if (raw) reservasLocalMemoria = aplicarEstadosPersistidos(JSON.parse(raw));
  } catch {
    /* storage bloqueado o legado inválido: se conserva la copia en memoria */
  }

  return clonarReservasLocalDemo(reservasLocalMemoria);
}

function guardarReservasLocalDemo(reservas: ReservaLocalDemo[]): void {
  reservasLocalMemoria = clonarReservasLocalDemo(reservas);
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(RESERVAS_LOCAL_KEY, JSON.stringify(reservas));
  } catch {
    /* storage bloqueado: la actualización queda disponible en memoria */
  }
}

export function marcarPaseReservaUsadoDemo(
  reservaId: string,
  paseId: string,
): ReservaLocalDemo[] {
  const reservas = listarReservasLocalDemo().map((reserva) =>
    reserva.id === reservaId
      ? {
          ...reserva,
          pases: reserva.pases.map((pase) =>
            pase.id === paseId ? { ...pase, estado: 'usado' as const } : pase,
          ),
        }
      : reserva,
  );

  guardarReservasLocalDemo(reservas);
  return clonarReservasLocalDemo(reservas);
}

function redondearSoles(monto: number): number {
  return Math.round(monto * 100) / 100;
}

export function calcularDesgloseDemo(
  total: number,
  politica: { adelantoPct: number; splitConsumoPct: number },
): DesgloseReservaDemo {
  const adelanto = redondearSoles((total * politica.adelantoPct) / 100);
  const creditoConsumo = redondearSoles((adelanto * politica.splitConsumoPct) / 100);
  const comisionServicio = redondearSoles(adelanto - creditoConsumo);
  return { adelanto, creditoConsumo, comisionServicio };
}

const ALFANUM_PASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function sufijoPaseDemo(): string {
  return Array.from({ length: 6 }, () =>
    ALFANUM_PASE.charAt(Math.floor(Math.random() * ALFANUM_PASE.length)),
  ).join('');
}

export function emitirPasesDemo(
  reservaId: string,
  zonaId: string,
  titular: string,
  cantidad: number,
): PaseReservaDemo[] {
  return Array.from({ length: Math.max(0, Math.floor(cantidad)) }, (_, indice) => {
    const sufijo = sufijoPaseDemo();
    return {
      id: `pase-${sufijo.toLowerCase()}`,
      codigo: `PAS-${sufijo}`,
      reservaId,
      zonaId,
      titular,
      indice: indice + 1,
      estado: 'activo',
    };
  });
}
