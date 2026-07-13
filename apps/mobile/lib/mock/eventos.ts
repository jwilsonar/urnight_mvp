/**
 * DATOS DEMO — eventos y locales del app móvil. Misma forma que el catálogo
 * web (seed de packages/db) para que, al conectar el backend, estos mocks se
 * reemplacen por fetchers del api-client sin tocar las pantallas.
 */

export interface EventoDemo {
  id: string;
  nombre: string;
  local: string;
  zona: string;
  fechaLabel: string;
  horaLabel: string;
  imageUrl: string;
  generos: string[];
  /** null = entrada gratuita vía promotor (MVP). */
  precioDesdeSoles: number | null;
  destacado: boolean;
  descripcion: string;
  dressCode: string;
}

const img = (seed: string) => `https://picsum.photos/seed/app-${seed}/800/1000`;

export const EVENTOS_DEMO: EventoDemo[] = [
  {
    id: 'e1',
    nombre: 'Reggaetón Old School',
    local: 'Nocturna Club',
    zona: 'Miraflores',
    fechaLabel: 'Sáb 18 Jul',
    horaLabel: '10:00 PM',
    imageUrl: img('oldschool'),
    generos: ['Reggaetón', 'Urbano'],
    precioDesdeSoles: null,
    destacado: true,
    descripcion:
      'Un viaje a los clásicos del reggaetón 2005–2015. Hosted by DJ Trauma. Tres ambientes y terraza.',
    dressCode: 'Casual',
  },
  {
    id: 'e2',
    nombre: 'Sunset Rooftop Sessions',
    local: 'Sky Lounge 360',
    zona: 'San Isidro',
    fechaLabel: 'Vie 17 Jul',
    horaLabel: '6:00 PM',
    imageUrl: img('sunset'),
    generos: ['House', 'Deep House'],
    precioDesdeSoles: 40,
    destacado: true,
    descripcion:
      'House y deep house al atardecer con vista panorámica de la ciudad. Coctelería de autor.',
    dressCode: 'Smart casual',
  },
  {
    id: 'e3',
    nombre: 'Techno Underground',
    local: 'Barranco Beats',
    zona: 'Barranco',
    fechaLabel: 'Sáb 18 Jul',
    horaLabel: '11:00 PM',
    imageUrl: img('techno'),
    generos: ['Techno', 'Electrónica'],
    precioDesdeSoles: 55,
    destacado: false,
    descripcion:
      'Line-up internacional y sistema de sonido de élite en el templo de la electrónica de Barranco.',
    dressCode: 'Black attire',
  },
  {
    id: 'e4',
    nombre: 'Noche de Karaoke Estelar',
    local: 'Karaoke Estelar',
    zona: 'Surco',
    fechaLabel: 'Jue 16 Jul',
    horaLabel: '8:00 PM',
    imageUrl: img('karaoke'),
    generos: ['Pop', 'Latin'],
    precioDesdeSoles: null,
    destacado: false,
    descripcion:
      'Salas privadas con catálogo de 50k canciones. Ideal para cumpleaños y grupos grandes.',
    dressCode: 'Libre',
  },
  {
    id: 'e5',
    nombre: 'Ladies Night — Open Bar',
    local: 'Nocturna Club',
    zona: 'Miraflores',
    fechaLabel: 'Vie 24 Jul',
    horaLabel: '10:30 PM',
    imageUrl: img('ladies'),
    generos: ['Reggaetón', 'Pop'],
    precioDesdeSoles: 30,
    destacado: true,
    descripcion: 'Open bar para ellas hasta la 1 AM. La noche más pedida del mes.',
    dressCode: 'Urban chic',
  },
];

export interface LocalDemo {
  slug: string;
  nombre: string;
  zona: string;
  tipo: string;
  imageUrl: string;
  cartaHabilitada: boolean;
}

export const LOCALES_DEMO: LocalDemo[] = [
  { slug: 'nocturna-club', nombre: 'Nocturna Club', zona: 'Miraflores', tipo: 'Discoteca', imageUrl: img('nocturna'), cartaHabilitada: true },
  { slug: 'sky-lounge-360', nombre: 'Sky Lounge 360', zona: 'San Isidro', tipo: 'Rooftop', imageUrl: img('sky'), cartaHabilitada: true },
  { slug: 'barranco-beats', nombre: 'Barranco Beats', zona: 'Barranco', tipo: 'Discoteca', imageUrl: img('beats'), cartaHabilitada: true },
  { slug: 'karaoke-estelar', nombre: 'Karaoke Estelar', zona: 'Surco', tipo: 'Karaoke', imageUrl: img('estelar'), cartaHabilitada: false },
];

export function eventoById(id: string): EventoDemo | undefined {
  return EVENTOS_DEMO.find((e) => e.id === id);
}
