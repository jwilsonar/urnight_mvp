/**
 * DATOS DEMO — registro rápido de ingresos atribuidos a promotores.
 * Este módulo se reemplazará por fetchers de lib/api/ cuando exista el backend;
 * los nombres camelCase ya están alineados a los contratos futuros.
 */

export interface PaloteoDemo {
  id: string;
  promotorId: string;
  promotorNombre: string;
  nombreInvitado?: string;
  zonaId: string;
  hora: string;
}

export interface PromotorLocalDemo {
  id: string;
  nombre: string;
  code: string;
}

export const PROMOTORES_LOCAL_DEMO: PromotorLocalDemo[] = [
  { id: 'promotor-andrea', nombre: 'Andrea Flores', code: 'ANDREA10' },
  { id: 'promotor-luis', nombre: 'Luis Quispe', code: 'LUISVIP' },
  { id: 'promotor-carlos', nombre: 'Carlos Núñez', code: 'CARLOSN' },
  { id: 'promotor-daniela', nombre: 'Daniela Ríos', code: 'DANIELAR' },
  { id: 'promotor-lucia', nombre: 'Lucía Paredes', code: 'LUCIAP' },
];

const PALOTEO_KEY = 'ravenue.paloteo';

function guardarPaloteosDemo(paloteos: PaloteoDemo[]): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(PALOTEO_KEY, JSON.stringify(paloteos));
  } catch {
    /* storage bloqueado: el paloteo queda solo en memoria del consumidor */
  }
}

export function registrarPaloteoDemo(
  datos: Omit<PaloteoDemo, 'id' | 'hora'>,
): PaloteoDemo {
  const paloteo: PaloteoDemo = {
    ...datos,
    id: `paloteo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    hora: new Date().toISOString(),
  };

  guardarPaloteosDemo([...listarPaloteosDemo(), paloteo]);
  return paloteo;
}

export function listarPaloteosDemo(): PaloteoDemo[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = sessionStorage.getItem(PALOTEO_KEY);
    return raw ? (JSON.parse(raw) as PaloteoDemo[]) : [];
  } catch {
    return [];
  }
}
