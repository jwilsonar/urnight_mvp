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
    codigo: 'UR-8F4K21',
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
    codigo: 'UR-2M9X07',
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
    codigo: 'UR-7Q1B44',
    evento: 'Reggaetón Night',
    venue: 'Nocturna Club · Miraflores',
    fecha: 'Vie 21 Mar · 10:30 PM',
    mesa: 'Lounge Premium',
    pax: 10,
    deposito: 800,
    estado: 'completada',
  },
];

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
