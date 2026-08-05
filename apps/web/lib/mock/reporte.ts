/**
 * DATOS DEMO — resumen operativo para la reunión semanal del local.
 * Se reemplazará por agregaciones del backend cuando exista el módulo de reportes.
 */
export const REPORTE_SEMANAL_DEMO = {
  semana: '13–19 jul 2026',
  ingresosPorPromotor: [
    {
      promotorNombre: 'Andrea Flores',
      porCodigos: 79,
      porLink: 34,
      porPaloteo: 18,
      ventasBoxSoles: 5680,
      comisionSoles: 681.6,
    },
    {
      promotorNombre: 'Luis Quispe',
      porCodigos: 66,
      porLink: 28,
      porPaloteo: 22,
      ventasBoxSoles: 4720,
      comisionSoles: 566.4,
    },
    {
      promotorNombre: 'Carlos Núñez',
      porCodigos: 58,
      porLink: 21,
      porPaloteo: 17,
      ventasBoxSoles: 3980,
      comisionSoles: 477.6,
    },
    {
      promotorNombre: 'Daniela Ríos',
      porCodigos: 63,
      porLink: 25,
      porPaloteo: 16,
      ventasBoxSoles: 4360,
      comisionSoles: 523.2,
    },
  ],
  reservas: {
    total: 31,
    confirmadas: 26,
    canceladas: 5,
    ingresosSoles: 14850,
  },
  incidencias: [
    {
      hora: '23:48',
      tipo: 'puerta',
      detalle: 'La fila de acceso general superó 12 minutos; se abrió un segundo carril.',
    },
    {
      hora: '00:35',
      tipo: 'reserva',
      detalle: 'Dos grupos llegaron con más asistentes de lo reservado y fueron reubicados.',
    },
    {
      hora: '01:12',
      tipo: 'sistema',
      detalle: 'Un lector quedó sin señal durante 4 minutos; se aplicó validación manual.',
    },
    {
      hora: '02:05',
      tipo: 'puerta',
      detalle: 'Se rechazó un reingreso y el equipo recordó la política antes de la salida.',
    },
  ] satisfies Array<{
    hora: string;
    tipo: 'puerta' | 'reserva' | 'sistema';
    detalle: string;
  }>,
  totales: {
    ingresosSoles: 38420,
    asistentes: 618,
    ticketPromedioSoles: 62.17,
  },
};
