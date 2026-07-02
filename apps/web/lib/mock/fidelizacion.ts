/**
 * DATOS DEMO — fidelización (Wallet 35, Referidos 36, Niveles 37 del
 * prototipo v3). Módulo mock intencional: el backend de fidelización aún no
 * existe; cuando exista, se reemplaza por fetchers en lib/api/.
 */

export interface MovimientoDemo {
  fecha: string;
  concepto: string;
  monto: string;
  tipo: 'in' | 'out';
  saldo: string;
}

export interface ReferidoDemo {
  nombre: string;
  estado: string;
  completado: boolean;
  fecha: string;
}

export interface BadgeDemo {
  nombre: string;
  sub: string;
  unlocked: boolean;
  icono: string;
}

export const WALLET_DEMO = {
  saldo: 'S/ 184.50',
  equivalencia: '≈ 1 botella premium · ≈ 2 entradas general',
  movimientos: [
    { fecha: '18 May 23:42', concepto: 'Reembolso · Reggaetón Night cancelado', monto: '+ S/ 60.00', tipo: 'in', saldo: 'S/ 184.50' },
    { fecha: '12 May 19:08', concepto: 'Compra · Deep House Session', monto: '− S/ 70.00', tipo: 'out', saldo: 'S/ 124.50' },
    { fecha: '10 May 14:11', concepto: 'Recarga · Yape ····8431', monto: '+ S/ 100.00', tipo: 'in', saldo: 'S/ 194.50' },
    { fecha: '08 May 21:30', concepto: 'Reserva mesa · Nocturna Club', monto: '− S/ 200.00', tipo: 'out', saldo: 'S/ 94.50' },
    { fecha: '03 May 11:55', concepto: 'Puntos canjeados (200 pts → S/ 20)', monto: '+ S/ 20.00', tipo: 'in', saldo: 'S/ 294.50' },
    { fecha: '25 Abr 18:42', concepto: 'Compra · Latin Pop Rooftop', monto: '− S/ 55.00', tipo: 'out', saldo: 'S/ 274.50' },
  ] satisfies MovimientoDemo[],
};

export const REFERIDOS_DEMO = {
  codigo: 'PIERO-NOCHE',
  invitados: 3,
  meta: 5,
  puntos: 90,
  lista: [
    { nombre: 'Mateo Solís', estado: '+30 pts · Compró su primera entrada', completado: true, fecha: '22 Abr' },
    { nombre: 'Camila Yáñez', estado: '+30 pts · Compró su primera entrada', completado: true, fecha: '15 Abr' },
    { nombre: 'Daniela Vega', estado: '+30 pts · Compró su primera entrada', completado: true, fecha: '02 Abr' },
    { nombre: 'Joaquín Bravo', estado: 'Aún no compra entrada', completado: false, fecha: '28 Mar' },
  ] satisfies ReferidoDemo[],
};

export const NIVEL_DEMO = {
  actual: 'Oro',
  puntos: 1240,
  siguiente: 'Diamante',
  puntosSiguiente: 2000,
  progresoPct: 62,
};

export const BADGES_DEMO: BadgeDemo[] = [
  { nombre: 'Primera vez', sub: 'Primera entrada comprada', unlocked: true, icono: '🎟️' },
  { nombre: 'Reserva VIP', sub: 'Primera mesa VIP reservada', unlocked: true, icono: '🥂' },
  { nombre: '10 noches en Barranco', sub: '10 eventos en Barranco', unlocked: true, icono: '🌃' },
  { nombre: 'Madrugador', sub: 'Compra antes de las 8 PM 5 veces', unlocked: true, icono: '🌅' },
  { nombre: 'Mesa VIP x3', sub: '3 boxes VIP reservados', unlocked: true, icono: '💎' },
  { nombre: 'Cumpleaños UrNight', sub: 'Celebra tu cumple con nosotros', unlocked: false, icono: '🎂' },
  { nombre: 'Trotamundos', sub: 'Visita 5 distritos distintos', unlocked: false, icono: '🗺️' },
  { nombre: 'Maratonista', sub: '10 noches en un mes', unlocked: false, icono: '🏃' },
  { nombre: 'Conexión Lima', sub: 'Trae 10 amigos a UrNight', unlocked: false, icono: '🤝' },
  { nombre: 'Local favorito', sub: '5 visitas al mismo local', unlocked: false, icono: '⭐' },
  { nombre: 'Crítico fino', sub: '10 reseñas escritas', unlocked: false, icono: '✍️' },
  { nombre: 'Hasta el amanecer', sub: '5 afterhours completos', unlocked: false, icono: '☀️' },
];
