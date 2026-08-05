/**
 * DATOS DEMO — fidelización (Wallet 35, Referidos 36, Niveles 37 del
 * prototipo v3). Módulo mock intencional: el backend de fidelización aún no
 * existe; cuando exista, se reemplaza por fetchers en lib/api/.
 */

export interface MovimientoDemo {
  fecha: string;
  concepto: string;
  monto: number;
  tipo: "in" | "out";
  saldo: number;
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
  saldo: 184.5,
  equivalencia: "≈ 1 botella premium · ≈ 2 entradas general",
  movimientos: [
    {
      fecha: "18 May 23:42",
      concepto: "Reembolso · Reggaetón Night cancelado",
      monto: 60,
      tipo: "in",
      saldo: 184.5,
    },
    {
      fecha: "12 May 19:08",
      concepto: "Compra · Deep House Session",
      monto: -70,
      tipo: "out",
      saldo: 124.5,
    },
    {
      fecha: "10 May 14:11",
      concepto: "Recarga · Yape ····8431",
      monto: 100,
      tipo: "in",
      saldo: 194.5,
    },
    {
      fecha: "08 May 21:30",
      concepto: "Reserva mesa · Nocturna Club",
      monto: -200,
      tipo: "out",
      saldo: 94.5,
    },
    {
      fecha: "03 May 11:55",
      concepto: "Puntos canjeados (200 pts → S/ 20)",
      monto: 20,
      tipo: "in",
      saldo: 294.5,
    },
    {
      fecha: "25 Abr 18:42",
      concepto: "Compra · Latin Pop Rooftop",
      monto: -55,
      tipo: "out",
      saldo: 274.5,
    },
  ] satisfies MovimientoDemo[],
};

export const REFERIDOS_DEMO = {
  codigo: "PIERO-NOCHE",
  invitados: 3,
  meta: 5,
  puntos: 90,
  lista: [
    {
      nombre: "Mateo Solís",
      estado: "+30 pts · Compró su primera entrada",
      completado: true,
      fecha: "22 Abr",
    },
    {
      nombre: "Camila Yáñez",
      estado: "+30 pts · Compró su primera entrada",
      completado: true,
      fecha: "15 Abr",
    },
    {
      nombre: "Daniela Vega",
      estado: "+30 pts · Compró su primera entrada",
      completado: true,
      fecha: "02 Abr",
    },
    {
      nombre: "Joaquín Bravo",
      estado: "Aún no compra entrada",
      completado: false,
      fecha: "28 Mar",
    },
  ] satisfies ReferidoDemo[],
};

export const NIVEL_DEMO = {
  actual: "Oro",
  puntos: 1240,
  siguiente: "Diamante",
  puntosSiguiente: 2000,
  progresoPct: 62,
};

/* ===== Configuración del programa (panel superadmin) =====
 * Vista de administración de lo que el consumer ya muestra en
 * /account/{wallet,niveles,referidos}. Misma historia, otro ángulo. */

export interface NivelConfigDemo {
  nombre: string;
  umbralPuntos: number;
  beneficios: string[];
  activo: boolean;
}

export const NIVELES_CONFIG_DEMO: NivelConfigDemo[] = [
  {
    nombre: "Bronce",
    umbralPuntos: 0,
    beneficios: ["Acceso a preventa estándar"],
    activo: true,
  },
  {
    nombre: "Plata",
    umbralPuntos: 500,
    beneficios: ["Preventa prioritaria", "1 cola preferente al mes"],
    activo: true,
  },
  {
    nombre: "Oro",
    umbralPuntos: 1200,
    beneficios: [
      "Cola preferente siempre",
      "5% en pedidos de carta",
      "Regalo de cumpleaños",
    ],
    activo: true,
  },
  {
    nombre: "Diamante",
    umbralPuntos: 2000,
    beneficios: [
      "Acceso VIP a lanzamientos",
      "10% en pedidos de carta",
      "Mesa garantizada 1 vez al mes",
    ],
    activo: true,
  },
];

export interface ReglaPuntosDemo {
  accion: string;
  puntos: string;
  activa: boolean;
}

export const PUNTOS_REGLAS_DEMO: ReglaPuntosDemo[] = [
  {
    accion: "Compra de entrada",
    puntos: "+10 pts por cada S/ 10",
    activa: true,
  },
  {
    accion: "Pedido de carta in-venue",
    puntos: "+5 pts por cada S/ 10",
    activa: true,
  },
  {
    accion: "Referido completa su primera compra",
    puntos: "+30 pts",
    activa: true,
  },
  { accion: "Check-in validado en evento", puntos: "+15 pts", activa: true },
  { accion: "Reseña publicada y aprobada", puntos: "+10 pts", activa: false },
];

export const FIDELIZACION_PARAMS_DEMO = {
  canje: "200 pts → S/ 20 en wallet",
  vigenciaPuntos: "12 meses desde su emisión",
  topeDiario: "500 pts por usuario",
};

export const BADGES_DEMO: BadgeDemo[] = [
  {
    nombre: "Primera vez",
    sub: "Primera entrada comprada",
    unlocked: true,
    icono: "🎟️",
  },
  {
    nombre: "Reserva VIP",
    sub: "Primera mesa VIP reservada",
    unlocked: true,
    icono: "🥂",
  },
  {
    nombre: "10 noches en Barranco",
    sub: "10 eventos en Barranco",
    unlocked: true,
    icono: "🌃",
  },
  {
    nombre: "Madrugador",
    sub: "Compra antes de las 8 PM 5 veces",
    unlocked: true,
    icono: "🌅",
  },
  {
    nombre: "Mesa VIP x3",
    sub: "3 boxes VIP reservados",
    unlocked: true,
    icono: "💎",
  },
  {
    nombre: "Cumpleaños RAVENUE",
    sub: "Celebra tu cumple con nosotros",
    unlocked: false,
    icono: "🎂",
  },
  {
    nombre: "Trotamundos",
    sub: "Visita 5 distritos distintos",
    unlocked: false,
    icono: "🗺️",
  },
  {
    nombre: "Maratonista",
    sub: "10 noches en un mes",
    unlocked: false,
    icono: "🏃",
  },
  {
    nombre: "Conexión Lima",
    sub: "Trae 10 amigos a RAVENUE",
    unlocked: false,
    icono: "🤝",
  },
  {
    nombre: "Local favorito",
    sub: "5 visitas al mismo local",
    unlocked: false,
    icono: "⭐",
  },
  {
    nombre: "Crítico fino",
    sub: "10 reseñas escritas",
    unlocked: false,
    icono: "✍️",
  },
  {
    nombre: "Hasta el amanecer",
    sub: "5 afterhours completos",
    unlocked: false,
    icono: "☀️",
  },
];

export interface MovimientoPuntosDemo {
  fechaLabel: string;
  concepto: string;
  puntos: number;
  tipo: "gana" | "canje";
}

/* El saldo neto de estos movimientos es 1,240 pts, igual al nivel demo. */
export const HISTORIAL_PUNTOS_DEMO: MovimientoPuntosDemo[] = [
  {
    fechaLabel: "12 Jul",
    concepto: "Compra de entrada · Neon Nights vol.5",
    puntos: 70,
    tipo: "gana",
  },
  {
    fechaLabel: "10 Jul",
    concepto: "Pedido de carta · Nocturna Club",
    puntos: 14,
    tipo: "gana",
  },
  {
    fechaLabel: "08 Jul",
    concepto: "Referido: Daniela Vega",
    puntos: 30,
    tipo: "gana",
  },
  {
    fechaLabel: "06 Jul",
    concepto: "Check-in validado · Sunset Rooftop",
    puntos: 15,
    tipo: "gana",
  },
  {
    fechaLabel: "03 Jul",
    concepto: "Canje: S/ 20 a wallet",
    puntos: -200,
    tipo: "canje",
  },
  {
    fechaLabel: "28 Jun",
    concepto: "Compra grupal de entradas · Barranco Beats",
    puntos: 450,
    tipo: "gana",
  },
  {
    fechaLabel: "21 Jun",
    concepto: "Compra grupal de entradas · Noche Latina",
    puntos: 500,
    tipo: "gana",
  },
  {
    fechaLabel: "14 Jun",
    concepto: "Pedido grupal de carta · Sky Lounge 360",
    puntos: 361,
    tipo: "gana",
  },
];

export interface CanjeOpcionDemo {
  id: string;
  nombre: string;
  detalle: string;
  costoPuntos: number;
  disponible: boolean;
}

export const CATALOGO_CANJE_DEMO: CanjeOpcionDemo[] = [
  {
    id: "wallet-20",
    nombre: "S/ 20 en wallet",
    detalle: "Saldo para tu próxima compra en RAVENUE.",
    costoPuntos: 200,
    disponible: true,
  },
  {
    id: "trago-cortesia",
    nombre: "Trago de cortesía",
    detalle: "Un trago seleccionado en locales participantes.",
    costoPuntos: 150,
    disponible: true,
  },
  {
    id: "cola-preferente",
    nombre: "Cola preferente x1",
    detalle: "Ingreso por la fila preferente una vez.",
    costoPuntos: 300,
    disponible: true,
  },
  {
    id: "botella-premium",
    nombre: "Botella premium −20%",
    detalle: "Descuento en una botella premium seleccionada.",
    costoPuntos: 800,
    disponible: true,
  },
  {
    id: "mesa-vip",
    nombre: "Mesa VIP garantizada",
    detalle: "Reserva prioritaria en un local participante.",
    costoPuntos: 2000,
    disponible: false,
  },
];
