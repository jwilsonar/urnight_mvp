/**
 * DATOS DEMO — aforo visible para consumidores.
 * El backend de check-in reemplazará este módulo cuando publique el aforo
 * agregado y la espera estimada de cada local.
 */

export type CrowdNivelDemo = 'bajo' | 'medio' | 'lleno';

export interface CrowdDemo {
  localSlug: string;
  dentro: number;
  capacidad: number;
  nivel: CrowdNivelDemo;
  esperaMin: number;
  actualizadoLabel: string;
}

export const CROWD_DEMO: CrowdDemo[] = [
  {
    localSlug: 'nocturna-club',
    dentro: 312,
    capacidad: 450,
    nivel: 'medio',
    esperaMin: 5,
    actualizadoLabel: 'hace 2 min',
  },
  {
    localSlug: 'sky-lounge-360',
    dentro: 88,
    capacidad: 150,
    nivel: 'medio',
    esperaMin: 0,
    actualizadoLabel: 'hace 2 min',
  },
  {
    localSlug: 'barranco-beats',
    dentro: 395,
    capacidad: 420,
    nivel: 'lleno',
    esperaMin: 20,
    actualizadoLabel: 'hace 2 min',
  },
  {
    localSlug: 'karaoke-estelar',
    dentro: 40,
    capacidad: 200,
    nivel: 'bajo',
    esperaMin: 0,
    actualizadoLabel: 'hace 2 min',
  },
];

export function crowdForSlug(slug: string): CrowdDemo | undefined {
  return CROWD_DEMO.find((crowd) => crowd.localSlug === slug);
}
