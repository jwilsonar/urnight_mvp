/**
 * DATOS DEMO — perfil del asistente: wallet, fidelización, referidos,
 * notificaciones y guardados. Espejo de apps/web/lib/mock/fidelizacion.ts
 * (mismos números: nivel Oro 1240/2000, saldo S/ 184.50, +30 pts por
 * referido) para que web y app cuenten la misma historia. Con backend se
 * reemplaza por fetchers del api-client.
 */

/* ===== Nivel y fidelización ===== */
export const NIVEL_DEMO = {
  actual: 'Oro',
  puntos: 1240,
  siguiente: 'Diamante',
  puntosSiguiente: 2000,
};

export interface BadgeDemo {
  nombre: string;
  criterio: string;
  unlocked: boolean;
  icono: string;
}

export const BADGES_DEMO: BadgeDemo[] = [
  { nombre: 'Primera vez', criterio: 'Primera entrada comprada', unlocked: true, icono: '🎟️' },
  { nombre: 'Reserva VIP', criterio: 'Primera mesa VIP reservada', unlocked: true, icono: '🥂' },
  { nombre: '10 noches en Barranco', criterio: '10 eventos en Barranco', unlocked: true, icono: '🌃' },
  { nombre: 'Madrugador', criterio: 'Compra antes de las 8 PM 5 veces', unlocked: true, icono: '🌅' },
  { nombre: 'Mesa VIP x3', criterio: '3 boxes VIP reservados', unlocked: true, icono: '💎' },
  { nombre: 'Cumpleaños UrNight', criterio: 'Celebra tu cumple con nosotros', unlocked: false, icono: '🎂' },
  { nombre: 'Trotamundos', criterio: 'Visita 5 distritos distintos', unlocked: false, icono: '🗺️' },
  { nombre: 'Maratonista', criterio: '10 noches en un mes', unlocked: false, icono: '🏃' },
  { nombre: 'Conexión Lima', criterio: 'Trae 10 amigos a UrNight', unlocked: false, icono: '🤝' },
  { nombre: 'Local favorito', criterio: '5 visitas al mismo local', unlocked: false, icono: '⭐' },
  { nombre: 'Crítico fino', criterio: '10 reseñas escritas', unlocked: false, icono: '✍️' },
  { nombre: 'Hasta el amanecer', criterio: '5 afterhours completos', unlocked: false, icono: '☀️' },
];

/* ===== Wallet ===== */
export const WALLET_DEMO = {
  saldo: 'S/ 184.50',
  equivalencia: '≈ 1 botella premium · ≈ 2 entradas general',
};

export interface MovimientoDemo {
  fechaLabel: string;
  concepto: string;
  monto: string;
  tipo: 'in' | 'out';
}

export const MOVIMIENTOS_DEMO: MovimientoDemo[] = [
  { fechaLabel: '18 May 23:42', concepto: 'Reembolso · Reggaetón Night cancelado', monto: '+ S/ 60.00', tipo: 'in' },
  { fechaLabel: '12 May 19:08', concepto: 'Compra · Deep House Session', monto: '− S/ 70.00', tipo: 'out' },
  { fechaLabel: '10 May 14:11', concepto: 'Recarga · Yape ····8431', monto: '+ S/ 100.00', tipo: 'in' },
  { fechaLabel: '08 May 21:30', concepto: 'Reserva mesa · Nocturna Club', monto: '− S/ 200.00', tipo: 'out' },
  { fechaLabel: '03 May 11:55', concepto: 'Puntos canjeados (200 pts → S/ 20)', monto: '+ S/ 20.00', tipo: 'in' },
  { fechaLabel: '25 Abr 18:42', concepto: 'Compra · Latin Pop Rooftop', monto: '− S/ 55.00', tipo: 'out' },
];

/* ===== Referidos ===== */
export const REFERIDOS_DEMO = {
  codigo: 'PIERO-NOCHE',
  invitados: 3,
  meta: 5,
  puntos: 90,
  lista: [
    { nombre: 'Mateo Solís', estado: '+30 pts · Compró su primera entrada', completado: true, fechaLabel: '22 Abr' },
    { nombre: 'Camila Yáñez', estado: '+30 pts · Compró su primera entrada', completado: true, fechaLabel: '15 Abr' },
    { nombre: 'Daniela Vega', estado: '+30 pts · Compró su primera entrada', completado: true, fechaLabel: '02 Abr' },
    { nombre: 'Joaquín Bravo', estado: 'Aún no compra entrada', completado: false, fechaLabel: '28 Mar' },
  ],
};

/* ===== Notificaciones ===== */
export interface NotificacionDemo {
  id: string;
  titulo: string;
  detalle: string;
  fechaLabel: string;
  leida: boolean;
  tipo: 'evento' | 'pedido' | 'puntos' | 'sistema';
}

export const NOTIFICACIONES_DEMO: NotificacionDemo[] = [
  { id: 'n1', titulo: 'Tu pedido está listo 🍹', detalle: 'Pedido UN-482 listo para recoger en Barra principal.', fechaLabel: 'Hace 5 min', leida: false, tipo: 'pedido' },
  { id: 'n2', titulo: 'Reggaetón Old School es este sábado', detalle: 'Tu entrada está en la app. Puertas desde las 10 PM.', fechaLabel: 'Hace 2 h', leida: false, tipo: 'evento' },
  { id: 'n3', titulo: '+30 puntos por tu referido', detalle: 'Daniela Vega compró su primera entrada con tu código.', fechaLabel: 'Ayer', leida: true, tipo: 'puntos' },
  { id: 'n4', titulo: 'Nuevo evento en Sky Lounge 360', detalle: 'Sunset Rooftop Sessions — entradas desde S/ 40.', fechaLabel: 'Hace 2 días', leida: true, tipo: 'evento' },
  { id: 'n5', titulo: 'Bienvenido a UrNight 🎉', detalle: 'Completa tu perfil y gana tus primeros puntos.', fechaLabel: 'Hace 1 semana', leida: true, tipo: 'sistema' },
];

/* ===== Guardados (favoritos) ===== */
/** Ids de EVENTOS_DEMO marcados como favoritos en la demo. */
export const GUARDADOS_DEMO: string[] = ['e1', 'e3', 'e5'];
