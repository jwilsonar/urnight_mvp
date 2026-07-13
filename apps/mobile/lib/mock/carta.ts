/**
 * DATOS DEMO — carta in-venue del app móvil (idea Wilson). Mismo shape que
 * apps/web/lib/mock/carta.ts: al conectar el backend ambos clientes consumen
 * el mismo módulo de catálogo in-venue vía contracts.
 */

export interface CartaCategoriaDemo {
  id: string;
  nombre: string;
}

export const CARTA_CATEGORIAS_DEMO: CartaCategoriaDemo[] = [
  { id: 'cocteles', nombre: 'Cócteles' },
  { id: 'botellas', nombre: 'Botellas' },
  { id: 'cervezas', nombre: 'Cervezas' },
  { id: 'shots', nombre: 'Shots' },
  { id: 'sin-alcohol', nombre: 'Sin alcohol' },
  { id: 'piqueos', nombre: 'Piqueos' },
];

export interface CartaItemDemo {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceSoles: number;
  imageUrl: string;
  available: boolean;
  tag?: string;
}

const img = (seed: string) => `https://picsum.photos/seed/carta-${seed}/640/480`;

export const CARTA_ITEMS_DEMO: CartaItemDemo[] = [
  { id: 'i1', categoryId: 'cocteles', name: 'Pisco Sour', description: 'Clásico peruano: pisco quebranta, limón y angostura.', priceSoles: 28, imageUrl: img('pisco-sour'), available: true, tag: 'Más pedido' },
  { id: 'i2', categoryId: 'cocteles', name: 'Chilcano de Maracuyá', description: 'Pisco, ginger ale y pulpa de maracuyá.', priceSoles: 26, imageUrl: img('chilcano'), available: true, tag: 'Especialidad' },
  { id: 'i3', categoryId: 'cocteles', name: 'Mojito Clásico', description: 'Ron blanco, hierbabuena fresca, lima y soda.', priceSoles: 25, imageUrl: img('mojito'), available: true, tag: '2×1' },
  { id: 'i4', categoryId: 'cocteles', name: 'Gin Tonic de la Casa', description: 'Gin premium, tónica artesanal y botánicos.', priceSoles: 32, imageUrl: img('gintonic'), available: true },
  { id: 'i6', categoryId: 'botellas', name: 'Botella Vodka Premium', description: 'Incluye 4 energizantes + hielo para tu mesa.', priceSoles: 280, imageUrl: img('vodka'), available: true, tag: 'Más pedido' },
  { id: 'i7', categoryId: 'botellas', name: 'Botella Whisky 12 años', description: 'Incluye 2 ginger ale + hielo. Servicio en mesa.', priceSoles: 350, imageUrl: img('whisky'), available: true },
  { id: 'i9', categoryId: 'botellas', name: 'Champagne Brut', description: 'Burbujas para celebrar, copas incluidas.', priceSoles: 420, imageUrl: img('champagne'), available: true, tag: 'Especialidad' },
  { id: 'i10', categoryId: 'cervezas', name: 'Cerveza Artesanal IPA', description: 'IPA local de barril, 473 ml.', priceSoles: 18, imageUrl: img('ipa'), available: true, tag: 'Nuevo' },
  { id: 'i12', categoryId: 'cervezas', name: 'Balde de Cervezas ×6', description: 'Seis clásicas en hielo. Para compartir.', priceSoles: 70, imageUrl: img('balde'), available: true, tag: '2×1' },
  { id: 'i13', categoryId: 'shots', name: 'Tanda de Tequila ×4', description: 'Cuatro shots con sal y limón.', priceSoles: 48, imageUrl: img('tequila'), available: true },
  { id: 'i14', categoryId: 'shots', name: 'Jäger Bomb', description: 'El infaltable con energizante.', priceSoles: 22, imageUrl: img('jager'), available: false },
  { id: 'i15', categoryId: 'sin-alcohol', name: 'Limonada Frozen', description: 'Limonada helada con hierbabuena.', priceSoles: 15, imageUrl: img('limonada'), available: true },
  { id: 'i17', categoryId: 'sin-alcohol', name: 'Agua Mineral', description: 'Con o sin gas, 500 ml.', priceSoles: 8, imageUrl: img('agua'), available: true },
  { id: 'i18', categoryId: 'piqueos', name: 'Tequeños ×8', description: 'Rellenos de queso con guacamole de la casa.', priceSoles: 24, imageUrl: img('tequenos'), available: true, tag: 'Más pedido' },
  { id: 'i19', categoryId: 'piqueos', name: 'Alitas BBQ ×10', description: 'Bañadas en salsa BBQ ahumada.', priceSoles: 32, imageUrl: img('alitas'), available: true },
];

export const CARTA_ZONA_RECOJO = 'Barra principal';

export function formatSoles(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}
