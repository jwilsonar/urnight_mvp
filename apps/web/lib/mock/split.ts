/**
 * DATOS DEMO — participantes para dividir un pedido.
 * Con el backend real, la pasarela generará links de cobro Yape/Plin por
 * persona y actualizará aquí el estado de cada pago.
 */

export interface SplitParticipanteDemo {
  id: string;
  nombre: string;
  pagado: boolean;
}

export const SPLIT_PARTICIPANTES_DEMO: SplitParticipanteDemo[] = [
  { id: 'tu', nombre: 'Tú', pagado: true },
  { id: 'mateo-rojas', nombre: 'Mateo Rojas', pagado: false },
  { id: 'valentina-diaz', nombre: 'Valentina Díaz', pagado: false },
  { id: 'lucia-paredes', nombre: 'Lucía Paredes', pagado: false },
];
