/**
 * DATOS DEMO — Carta in-venue (idea Wilson): al validarse la entrada, el
 * usuario accede a la carta del local (bebidas, botellas, cócteles, piqueos),
 * arma un pedido y lo recoge en la zona indicada. Sin pagos en el MVP (llegan
 * con pasarela + wallet). Módulo mock intencional: cuando exista el backend,
 * cada bloque se reemplaza por fetchers en lib/api/ y schemas en contracts
 * (nombres de campos ya alineados a esa convención camelCase).
 */

/* ===== Categorías de la carta ===== */
export interface CartaCategoryDemo {
  id: string;
  name: string;
  displayOrder: number;
}

export const CARTA_CATEGORIAS_DEMO: CartaCategoryDemo[] = [
  { id: 'cocteles', name: 'Cócteles', displayOrder: 1 },
  { id: 'botellas', name: 'Botellas', displayOrder: 2 },
  { id: 'cervezas', name: 'Cervezas', displayOrder: 3 },
  { id: 'shots', name: 'Shots', displayOrder: 4 },
  { id: 'sin-alcohol', name: 'Sin alcohol', displayOrder: 5 },
  { id: 'piqueos', name: 'Piqueos', displayOrder: 6 },
];

/* ===== Productos ===== */
export type CartaTagDemo = '2x1' | 'especialidad' | 'nuevo' | 'popular';

export const CARTA_TAG_LABEL: Record<CartaTagDemo, string> = {
  '2x1': '2×1',
  especialidad: 'Especialidad de la casa',
  nuevo: 'Nuevo',
  popular: 'Más pedido',
};

export interface CartaItemDemo {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceSoles: number;
  /** URL de imagen placeholder; en backend será un key de storage. */
  imageUrl: string;
  available: boolean;
  tags: CartaTagDemo[];
}

const img = (seed: string) => `https://picsum.photos/seed/carta-${seed}/640/480`;

export const CARTA_ITEMS_DEMO: CartaItemDemo[] = [
  // Cócteles
  { id: 'i1', categoryId: 'cocteles', name: 'Pisco Sour', description: 'Clásico peruano: pisco quebranta, limón, jarabe y amargo de angostura.', priceSoles: 28, imageUrl: img('pisco-sour'), available: true, tags: ['popular'] },
  { id: 'i2', categoryId: 'cocteles', name: 'Chilcano de Maracuyá', description: 'Pisco, ginger ale y pulpa de maracuyá. Refrescante y con carácter.', priceSoles: 26, imageUrl: img('chilcano'), available: true, tags: ['especialidad'] },
  { id: 'i3', categoryId: 'cocteles', name: 'Mojito Clásico', description: 'Ron blanco, hierbabuena fresca, lima y soda.', priceSoles: 25, imageUrl: img('mojito'), available: true, tags: ['2x1'] },
  { id: 'i4', categoryId: 'cocteles', name: 'Gin Tonic de la Casa', description: 'Gin premium, tónica artesanal y botánicos seleccionados.', priceSoles: 32, imageUrl: img('gintonic'), available: true, tags: [] },
  { id: 'i5', categoryId: 'cocteles', name: 'Laguna Azul', description: 'Vodka, curaçao azul y limón. El favorito de la pista.', priceSoles: 27, imageUrl: img('laguna'), available: false, tags: ['nuevo'] },
  // Botellas
  { id: 'i6', categoryId: 'botellas', name: 'Botella Vodka Premium', description: 'Incluye 4 energizantes + hielo ilimitado para tu mesa.', priceSoles: 280, imageUrl: img('vodka'), available: true, tags: ['popular'] },
  { id: 'i7', categoryId: 'botellas', name: 'Botella Whisky 12 años', description: 'Incluye 2 ginger ale + hielo. Servicio en mesa.', priceSoles: 350, imageUrl: img('whisky'), available: true, tags: [] },
  { id: 'i8', categoryId: 'botellas', name: 'Botella Ron Añejo', description: 'Incluye 4 colas + limones. Ideal para grupos.', priceSoles: 220, imageUrl: img('ron'), available: true, tags: [] },
  { id: 'i9', categoryId: 'botellas', name: 'Champagne Brut', description: 'Burbujas para celebrar. Incluye copas para toda la mesa.', priceSoles: 420, imageUrl: img('champagne'), available: true, tags: ['especialidad'] },
  // Cervezas
  { id: 'i10', categoryId: 'cervezas', name: 'Cerveza Artesanal IPA', description: 'IPA local de barril, 473 ml.', priceSoles: 18, imageUrl: img('ipa'), available: true, tags: ['nuevo'] },
  { id: 'i11', categoryId: 'cervezas', name: 'Cerveza Clásica', description: 'Lager nacional bien helada, 355 ml.', priceSoles: 14, imageUrl: img('lager'), available: true, tags: [] },
  { id: 'i12', categoryId: 'cervezas', name: 'Balde de Cervezas ×6', description: 'Seis clásicas en hielo. Para compartir.', priceSoles: 70, imageUrl: img('balde'), available: true, tags: ['popular', '2x1'] },
  // Shots
  { id: 'i13', categoryId: 'shots', name: 'Tanda de Tequila ×4', description: 'Cuatro shots con sal y limón.', priceSoles: 48, imageUrl: img('tequila'), available: true, tags: ['popular'] },
  { id: 'i14', categoryId: 'shots', name: 'Jäger Bomb', description: 'El infaltable con energizante.', priceSoles: 22, imageUrl: img('jager'), available: true, tags: [] },
  // Sin alcohol
  { id: 'i15', categoryId: 'sin-alcohol', name: 'Limonada Frozen', description: 'Limonada helada con hierbabuena.', priceSoles: 15, imageUrl: img('limonada'), available: true, tags: [] },
  { id: 'i16', categoryId: 'sin-alcohol', name: 'Energizante', description: 'Lata 355 ml bien fría.', priceSoles: 12, imageUrl: img('energy'), available: true, tags: [] },
  { id: 'i17', categoryId: 'sin-alcohol', name: 'Agua Mineral', description: 'Con o sin gas, 500 ml.', priceSoles: 8, imageUrl: img('agua'), available: true, tags: [] },
  // Piqueos
  { id: 'i18', categoryId: 'piqueos', name: 'Tequeños ×8', description: 'Rellenos de queso con guacamole de la casa.', priceSoles: 24, imageUrl: img('tequenos'), available: true, tags: ['popular'] },
  { id: 'i19', categoryId: 'piqueos', name: 'Alitas BBQ ×10', description: 'Bañadas en salsa BBQ ahumada.', priceSoles: 32, imageUrl: img('alitas'), available: true, tags: [] },
  { id: 'i20', categoryId: 'piqueos', name: 'Piqueo Criollo', description: 'Chicharrón, choclo y salsas para compartir.', priceSoles: 45, imageUrl: img('criollo'), available: false, tags: ['especialidad'] },
];

/* ===== Pedidos (cola demo del panel + estado del usuario) ===== */
export type CartaOrderStatusDemo = 'received' | 'preparing' | 'ready' | 'delivered';

export const CARTA_ORDER_STATUS_LABEL: Record<CartaOrderStatusDemo, string> = {
  received: 'Recibido',
  preparing: 'Preparando',
  ready: 'Listo para recoger',
  delivered: 'Entregado',
};

export interface CartaOrderItemDemo {
  itemId: string;
  name: string;
  quantity: number;
  unitPriceSoles: number;
}

export interface CartaOrderDemo {
  id: string;
  /** Código corto que el usuario muestra en la zona de recojo. */
  pickupCode: string;
  attendeeName: string;
  items: CartaOrderItemDemo[];
  totalSoles: number;
  status: CartaOrderStatusDemo;
  placedAtLabel: string;
  pickupZone: string;
}

export const CARTA_PEDIDOS_DEMO: CartaOrderDemo[] = [
  {
    id: 'p1', pickupCode: 'UN-482', attendeeName: 'Sofía Castro',
    items: [
      { itemId: 'i1', name: 'Pisco Sour', quantity: 2, unitPriceSoles: 28 },
      { itemId: 'i18', name: 'Tequeños ×8', quantity: 1, unitPriceSoles: 24 },
    ],
    totalSoles: 80, status: 'ready', placedAtLabel: '12:38 AM', pickupZone: 'Barra principal',
  },
  {
    id: 'p2', pickupCode: 'UN-483', attendeeName: 'Mateo Rojas',
    items: [{ itemId: 'i6', name: 'Botella Vodka Premium', quantity: 1, unitPriceSoles: 280 }],
    totalSoles: 280, status: 'preparing', placedAtLabel: '12:41 AM', pickupZone: 'Mini bar · Zona VIP',
  },
  {
    id: 'p3', pickupCode: 'UN-484', attendeeName: 'Valentina Díaz',
    items: [
      { itemId: 'i12', name: 'Balde de Cervezas ×6', quantity: 1, unitPriceSoles: 70 },
      { itemId: 'i13', name: 'Tanda de Tequila ×4', quantity: 1, unitPriceSoles: 48 },
    ],
    totalSoles: 118, status: 'received', placedAtLabel: '12:44 AM', pickupZone: 'Barra principal',
  },
  {
    id: 'p4', pickupCode: 'UN-479', attendeeName: 'Luis Quispe',
    items: [{ itemId: 'i3', name: 'Mojito Clásico', quantity: 2, unitPriceSoles: 25 }],
    totalSoles: 50, status: 'delivered', placedAtLabel: '12:15 AM', pickupZone: 'Barra principal',
  },
];

/* ===== Configuración de carta por local ===== */
export interface CartaConfigDemo {
  localSlug: string;
  localName: string;
  enabled: boolean;
  pickupZone: string;
  /** Horario en que la carta acepta pedidos. */
  schedule: string;
}

export const CARTA_CONFIG_DEMO: CartaConfigDemo[] = [
  { localSlug: 'nocturna-club', localName: 'Nocturna Club', enabled: true, pickupZone: 'Barra principal', schedule: '10:00 PM – 4:00 AM' },
  { localSlug: 'sky-lounge-360', localName: 'Sky Lounge 360', enabled: true, pickupZone: 'Mini bar · Terraza', schedule: '6:00 PM – 2:00 AM' },
  { localSlug: 'barranco-beats', localName: 'Barranco Beats', enabled: true, pickupZone: 'Barra central', schedule: '11:00 PM – 5:00 AM' },
  { localSlug: 'karaoke-estelar', localName: 'Karaoke Estelar', enabled: false, pickupZone: 'Barra de salas', schedule: '8:00 PM – 2:00 AM' },
];

/**
 * Resuelve el slug de carta desde el nombre del local de una entrada
 * (TicketResponse.venueName no trae slug). Fallback al primer local demo para
 * que el flujo entrada → carta siempre sea navegable en la demo.
 */
export function resolveCartaSlug(venueName: string | null | undefined): string {
  const match = CARTA_CONFIG_DEMO.find((c) => c.localName === venueName);
  return (match ?? CARTA_CONFIG_DEMO[0]!).localSlug;
}

export function cartaConfigForSlug(slug: string): CartaConfigDemo {
  return CARTA_CONFIG_DEMO.find((c) => c.localSlug === slug) ?? CARTA_CONFIG_DEMO[0]!;
}
