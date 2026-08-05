/**
 * DATOS DEMO — perfil social y conexiones entre usuarios.
 * El backend social reemplazará estas listas por amistades, solicitudes y
 * noches compartidas persistidas por cuenta.
 */

export interface AmigoDemo {
  id: string;
  nombre: string;
  nivel: string;
  ultimaNoche: string;
  eventosJuntos: number;
}

export const AMIGOS_DEMO: AmigoDemo[] = [
  {
    id: 'mateo-rojas',
    nombre: 'Mateo Rojas',
    nivel: 'Plata',
    ultimaNoche: 'Nocturna Club · 08 Jul',
    eventosJuntos: 7,
  },
  {
    id: 'valentina-diaz',
    nombre: 'Valentina Díaz',
    nivel: 'Oro',
    ultimaNoche: 'Sky Lounge 360 · 05 Jul',
    eventosJuntos: 9,
  },
  {
    id: 'lucia-paredes',
    nombre: 'Lucía Paredes',
    nivel: 'Bronce',
    ultimaNoche: 'Barranco Beats · 28 Jun',
    eventosJuntos: 4,
  },
  {
    id: 'carlos-nunez',
    nombre: 'Carlos Núñez',
    nivel: 'Diamante',
    ultimaNoche: 'Nocturna Club · 21 Jun',
    eventosJuntos: 6,
  },
  {
    id: 'daniela-rios',
    nombre: 'Daniela Ríos',
    nivel: 'Plata',
    ultimaNoche: 'Karaoke Estelar · 15 Jun',
    eventosJuntos: 3,
  },
  {
    id: 'joaquin-bravo',
    nombre: 'Joaquín Bravo',
    nivel: 'Oro',
    ultimaNoche: 'Sky Lounge 360 · 08 Jun',
    eventosJuntos: 1,
  },
];

export interface SolicitudDemo {
  id: string;
  nombre: string;
  mutuos: number;
}

export const SOLICITUDES_DEMO: SolicitudDemo[] = [
  { id: 'camila-yanez', nombre: 'Camila Yáñez', mutuos: 3 },
  { id: 'mateo-solis', nombre: 'Mateo Solís', mutuos: 2 },
];
