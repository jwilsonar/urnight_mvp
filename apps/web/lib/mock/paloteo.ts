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
  documento?: string;
  cantidad: number;
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

function normalizarCantidad(cantidad: unknown): number {
  if (typeof cantidad !== 'number' || !Number.isFinite(cantidad)) return 1;
  return Math.min(20, Math.max(1, Math.floor(cantidad)));
}

function normalizarDocumento(documento: unknown): string | undefined {
  if (typeof documento !== 'string') return undefined;

  const normalizado = documento
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 20)
    .toUpperCase();
  return normalizado || undefined;
}

// Dato personal: los listados siempre usan la versión enmascarada; el valor completo
// solo se muestra durante el cotejo de la validación en curso.
export function documentoEnmascarado(documento?: string): string | null {
  const normalizado = normalizarDocumento(documento);
  if (!normalizado) return null;
  if (normalizado.length <= 3) return '*'.repeat(normalizado.length);

  return `*****${normalizado.slice(-3)}`;
}

function guardarPaloteosDemo(paloteos: PaloteoDemo[]): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(PALOTEO_KEY, JSON.stringify(paloteos));
  } catch {
    /* storage bloqueado: el paloteo queda solo en memoria del consumidor */
  }
}

export function registrarPaloteoDemo(
  datos: Omit<PaloteoDemo, 'id' | 'hora' | 'cantidad'> & { cantidad?: number },
): PaloteoDemo {
  const { documento: documentoIngresado, ...datosRestantes } = datos;
  const documento = normalizarDocumento(documentoIngresado);
  const paloteo: PaloteoDemo = {
    ...datosRestantes,
    ...(documento ? { documento } : {}),
    cantidad: normalizarCantidad(datos.cantidad),
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
    if (!raw) return [];

    const paloteos = JSON.parse(raw) as Array<
      Omit<PaloteoDemo, 'cantidad'> & { cantidad?: number }
    >;
    return paloteos.map((paloteo) => {
      const { documento: documentoGuardado, ...datosRestantes } = paloteo;
      const documento = normalizarDocumento(documentoGuardado);

      return {
        ...datosRestantes,
        ...(documento ? { documento } : {}),
        cantidad: normalizarCantidad(paloteo.cantidad),
      };
    });
  } catch {
    return [];
  }
}
