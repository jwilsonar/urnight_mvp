/**
 * DATOS DEMO — pantallas avanzadas de paneles del prototipo v3 que aún no
 * tienen backend: PL Mesas/planta (100), PL Reservas del día (101), PL
 * Check-in en vivo (107-108), RRPP Liquidaciones (82), SA Antifraude (124) y
 * SA Salud del producto (126). Módulo mock intencional: cuando exista el
 * backend, cada bloque se reemplaza por fetchers en lib/api/.
 */

/* ===== PL · Mesas y planta ===== */
export interface MesaPlantaDemo {
  id: string;
  label: string;
  zone: 'Pista' | 'VIP' | 'Lounge';
  cap: number;
  estado: 'libre' | 'reservada' | 'ocupada';
  layout: { x: number; y: number; w: number; h: number };
}

export const MESAS_PLANTA_DEMO: MesaPlantaDemo[] = [
  { id: 'm1', label: 'Mesa 04', zone: 'Pista', cap: 4, estado: 'ocupada', layout: { x: 50, y: 70, w: 60, h: 55 } },
  { id: 'm2', label: 'Mesa 07', zone: 'Pista', cap: 4, estado: 'libre', layout: { x: 130, y: 70, w: 60, h: 55 } },
  { id: 'm3', label: 'Box VIP 01', zone: 'VIP', cap: 8, estado: 'reservada', layout: { x: 340, y: 70, w: 90, h: 55 } },
  { id: 'm4', label: 'Box VIP 02', zone: 'VIP', cap: 8, estado: 'ocupada', layout: { x: 450, y: 70, w: 90, h: 55 } },
  { id: 'm5', label: 'Lounge Premium', zone: 'Lounge', cap: 12, estado: 'reservada', layout: { x: 50, y: 260, w: 180, h: 90 } },
  { id: 'm6', label: 'Box VIP 03', zone: 'VIP', cap: 8, estado: 'libre', layout: { x: 340, y: 140, w: 90, h: 55 } },
  { id: 'm7', label: 'Mesa 11', zone: 'Pista', cap: 4, estado: 'ocupada', layout: { x: 50, y: 140, w: 60, h: 55 } },
  { id: 'm8', label: 'Mesa 12', zone: 'Pista', cap: 4, estado: 'libre', layout: { x: 130, y: 140, w: 60, h: 55 } },
];

/* ===== PL · Reservas del día ===== */
export interface ReservaDiaDemo {
  hora: string;
  mesa: string;
  nombre: string;
  pax: number;
  deposito: number;
  estado: 'confirmada' | 'pendiente' | 'llegó';
  nota?: string;
}

export const RESERVAS_DIA_DEMO: ReservaDiaDemo[] = [
  { hora: '10:30 PM', mesa: 'Box VIP 02', nombre: 'Valeria Cruz', pax: 8, deposito: 400, estado: 'llegó' },
  { hora: '11:00 PM', mesa: 'Mesa 04', nombre: 'Piero Rivera', pax: 4, deposito: 200, estado: 'llegó', nota: '🎂 Cumpleaños' },
  { hora: '11:00 PM', mesa: 'Lounge Premium', nombre: 'Grupo Ramírez', pax: 12, deposito: 800, estado: 'confirmada' },
  { hora: '11:30 PM', mesa: 'Box VIP 01', nombre: 'Andrea Flores', pax: 6, deposito: 400, estado: 'confirmada' },
  { hora: '12:00 AM', mesa: 'Mesa 11', nombre: 'Luis Quispe', pax: 4, deposito: 200, estado: 'pendiente' },
];

/* ===== PL · Check-in en vivo ===== */
export const AFORO_DEMO = { dentro: 312, capacidad: 450 };

export interface CheckinDemo {
  hora: string;
  nombre: string;
  tipo: 'General' | 'VIP' | 'Cortesía' | 'Reserva mesa' | 'Paloteo';
  zonaId: string;
  documento?: string;
  valido: boolean;
}

export const CHECKINS_DEMO: CheckinDemo[] = [
  {
    hora: '12:42 AM',
    nombre: 'Sofía Castro',
    tipo: 'General',
    zonaId: 'general',
    documento: '73148204',
    valido: true,
  },
  {
    hora: '12:41 AM',
    nombre: 'Mateo Rojas',
    tipo: 'VIP',
    zonaId: 'vip',
    documento: '46821957',
    valido: true,
  },
  {
    hora: '12:40 AM',
    nombre: 'QR ya utilizado',
    tipo: 'General',
    zonaId: 'general',
    valido: false,
  },
  {
    hora: '12:38 AM',
    nombre: 'Valeria Cruz +7',
    tipo: 'Reserva mesa',
    zonaId: 'super-vip',
    documento: '70416328',
    valido: true,
  },
  {
    hora: '12:35 AM',
    nombre: 'Diego Vargas',
    tipo: 'Cortesía',
    zonaId: 'general',
    documento: '61957043',
    valido: true,
  },
  {
    hora: '12:33 AM',
    nombre: 'Camila Yáñez',
    tipo: 'General',
    zonaId: 'general',
    valido: true,
  },
];

/* ===== RRPP · Liquidaciones ===== */
export interface LiquidacionDemo {
  periodo: string;
  ventas: number;
  comision: string;
  estado: 'pagada' | 'en proceso' | 'por liquidar';
  fechaPago: string;
}

export const LIQUIDACIONES_DEMO: LiquidacionDemo[] = [
  { periodo: '1–15 May 2026', ventas: 34, comision: 'S/ 1,840.00', estado: 'por liquidar', fechaPago: 'Vie 24 May' },
  { periodo: '16–30 Abr 2026', ventas: 41, comision: 'S/ 2,210.00', estado: 'en proceso', fechaPago: 'Vie 10 May' },
  { periodo: '1–15 Abr 2026', ventas: 38, comision: 'S/ 1,975.00', estado: 'pagada', fechaPago: 'Vie 26 Abr' },
  { periodo: '16–31 Mar 2026', ventas: 29, comision: 'S/ 1,480.00', estado: 'pagada', fechaPago: 'Vie 12 Abr' },
];

/* ===== SA · Antifraude ===== */
export interface AlertaFraudeDemo {
  id: string;
  severidad: 'alta' | 'media' | 'baja';
  titulo: string;
  detalle: string;
  hace: string;
}

export const ALERTAS_FRAUDE_DEMO: AlertaFraudeDemo[] = [
  {
    id: 'f1',
    severidad: 'alta',
    titulo: 'Reventa detectada — QR compartido',
    detalle: 'El mismo QR de "Reggaetón Night" se intentó validar 4 veces desde dispositivos distintos.',
    hace: 'hace 12 min',
  },
  {
    id: 'f2',
    severidad: 'media',
    titulo: 'Velocidad de compra anómala',
    detalle: 'Cuenta nueva compró 9 entradas en 3 eventos distintos en menos de 2 minutos.',
    hace: 'hace 1 h',
  },
  {
    id: 'f3',
    severidad: 'media',
    titulo: 'Múltiples tarjetas rechazadas',
    detalle: '5 intentos de pago fallidos con tarjetas distintas desde la misma sesión.',
    hace: 'hace 3 h',
  },
  {
    id: 'f4',
    severidad: 'baja',
    titulo: 'Código promotor fuera de zona',
    detalle: 'El código ANDREA10 registró clicks masivos desde fuera del país.',
    hace: 'ayer',
  },
];

/* ===== SA · Salud del producto ===== */
export interface MetricaSaludDemo {
  nombre: string;
  valor: string;
  sub: string;
  ok: boolean;
}

export const SALUD_DEMO: MetricaSaludDemo[] = [
  { nombre: 'Disponibilidad API', valor: '99.97%', sub: 'Últimos 30 días', ok: true },
  { nombre: 'Latencia p95', valor: '184 ms', sub: 'Endpoints públicos', ok: true },
  { nombre: 'Errores 5xx', valor: '0.02%', sub: 'Últimas 24 h', ok: true },
  { nombre: 'Cola de notificaciones', valor: '12', sub: 'Trabajos pendientes', ok: true },
  { nombre: 'Validaciones offline sin sincronizar', valor: '3', sub: 'App de puerta', ok: false },
  { nombre: 'Webhooks de pago', valor: '100%', sub: 'Entregados hoy', ok: true },
];

export const SERVICIOS_DEMO = [
  { nombre: 'API pública', estado: 'operativo' },
  { nombre: 'Pagos y checkout', estado: 'operativo' },
  { nombre: 'Emisión de QR', estado: 'operativo' },
  { nombre: 'Notificaciones (worker)', estado: 'operativo' },
  { nombre: 'Sincronización app validador', estado: 'degradado' },
] as const;
