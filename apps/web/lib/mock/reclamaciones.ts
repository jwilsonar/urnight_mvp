/**
 * DATOS DEMO — bandeja del Libro de Reclamaciones. El consumer ya tiene el
 * formulario público (/reclamaciones); esta es la contraparte de gestión del
 * superadmin. Módulo mock intencional: cuando exista el backend de trust/ops,
 * se reemplaza por fetchers en lib/api/.
 */

export type ReclamacionEstadoDemo = 'nueva' | 'en_revision' | 'resuelta';

export const RECLAMACION_ESTADO_LABEL: Record<ReclamacionEstadoDemo, string> = {
  nueva: 'Nueva',
  en_revision: 'En revisión',
  resuelta: 'Resuelta',
};

export interface ReclamacionDemo {
  id: string;
  /** Código correlativo del Libro de Reclamaciones. */
  codigo: string;
  fechaLabel: string;
  usuario: string;
  local: string;
  tipo: 'producto' | 'servicio';
  estado: ReclamacionEstadoDemo;
  resumen: string;
  detalle: string;
}

export const RECLAMACIONES_DEMO: ReclamacionDemo[] = [
  {
    id: 'r1', codigo: 'LR-2026-0148', fechaLabel: '11 Jul', usuario: 'Sofía Castro',
    local: 'Nocturna Club', tipo: 'servicio', estado: 'nueva',
    resumen: 'Cobro doble en la entrada',
    detalle: 'Indica que su entrada gratuita canjeada con código de promotor fue cobrada igual en puerta. Adjunta captura del QR validado.',
  },
  {
    id: 'r2', codigo: 'LR-2026-0147', fechaLabel: '10 Jul', usuario: 'Mateo Rojas',
    local: 'Barranco Beats', tipo: 'producto', estado: 'nueva',
    resumen: 'Botella distinta a la pedida',
    detalle: 'Pidió botella premium por la carta in-venue y recibió una estándar. Solicita reembolso de la diferencia.',
  },
  {
    id: 'r3', codigo: 'LR-2026-0143', fechaLabel: '08 Jul', usuario: 'Valentina Díaz',
    local: 'Sky Lounge 360', tipo: 'servicio', estado: 'en_revision',
    resumen: 'Evento empezó 2 horas tarde',
    detalle: 'El evento anunciado para las 6 PM inició pasadas las 8 PM sin aviso. Pide compensación en puntos.',
  },
  {
    id: 'r4', codigo: 'LR-2026-0141', fechaLabel: '06 Jul', usuario: 'Carlos Núñez',
    local: 'Karaoke Estelar', tipo: 'servicio', estado: 'en_revision',
    resumen: 'Reserva de sala no respetada',
    detalle: 'Reservó sala para 8 personas y al llegar estaba ocupada. Le reubicaron en una sala menor sin ajuste de precio.',
  },
  {
    id: 'r5', codigo: 'LR-2026-0137', fechaLabel: '02 Jul', usuario: 'Lucía Paredes',
    local: 'Nocturna Club', tipo: 'producto', estado: 'resuelta',
    resumen: 'Cóctel en mal estado',
    detalle: 'Reportó un cóctel con sabor extraño. El local repuso el producto en el momento y ofreció cortesía. Cerrada con conformidad.',
  },
  {
    id: 'r6', codigo: 'LR-2026-0132', fechaLabel: '28 Jun', usuario: 'Daniela Ríos',
    local: 'Barranco Beats', tipo: 'servicio', estado: 'resuelta',
    resumen: 'QR no escaneaba en puerta',
    detalle: 'Su QR no cargaba por señal dentro del local. El validador la registró manualmente. Se sugirió cachear el QR offline en la app.',
  },
  {
    id: 'r7', codigo: 'LR-2026-0129', fechaLabel: '25 Jun', usuario: 'Joaquín Bravo',
    local: 'Sky Lounge 360', tipo: 'servicio', estado: 'resuelta',
    resumen: 'Trato inadecuado del personal',
    detalle: 'Reportó mala atención en barra. El local respondió con disculpas y capacitación al personal. Usuario conforme.',
  },
];
