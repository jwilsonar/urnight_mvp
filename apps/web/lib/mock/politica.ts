/**
 * DATOS DEMO — política operativa configurable por local.
 * Este módulo se reemplazará por fetchers de lib/api/ cuando exista el backend;
 * los nombres camelCase ya están alineados a los contratos futuros.
 */

export interface ZonaLocalDemo {
  id: string;
  nombre: string;
  orden: number;
  color: string;
  activa: boolean;
}

export interface ReglaMetaDemo {
  id: string;
  tipo: 'por_evento' | 'acumulada_mes';
  umbral: number;
  recompensaTipo: 'efectivo' | 'especie';
  recompensaValor: number;
  recompensaDetalle?: string;
  activa: boolean;
}

export interface PoliticaLocalDemo {
  localSlug: string;
  adelantoPct: 50 | 100;
  splitConsumoPct: 90 | 100;
  reingresoPermitido: boolean;
  paloteoHabilitado: boolean;
  cupoCodigosPorPromotor: number;
  zonas: ZonaLocalDemo[];
  metas: ReglaMetaDemo[];
}

export const POLITICA_DEFAULT: PoliticaLocalDemo = {
  localSlug: 'nocturna-club',
  adelantoPct: 50,
  splitConsumoPct: 90,
  reingresoPermitido: false,
  paloteoHabilitado: true,
  cupoCodigosPorPromotor: 30,
  zonas: [
    { id: 'general', nombre: 'General', orden: 1, color: '#c62850', activa: true },
    { id: 'vip', nombre: 'VIP', orden: 2, color: '#f59e0b', activa: true },
    { id: 'super-vip', nombre: 'SUPER VIP', orden: 3, color: '#ef4444', activa: true },
  ],
  metas: [
    {
      id: 'meta-evento-20',
      tipo: 'por_evento',
      umbral: 20,
      recompensaTipo: 'efectivo',
      recompensaValor: 100,
      recompensaDetalle: '+ 1 botella',
      activa: true,
    },
    {
      id: 'meta-mes-40',
      tipo: 'acumulada_mes',
      umbral: 40,
      recompensaTipo: 'efectivo',
      recompensaValor: 150,
      activa: true,
    },
  ],
};

function politicaDefaultPara(localSlug: string): PoliticaLocalDemo {
  return {
    ...POLITICA_DEFAULT,
    localSlug,
    zonas: POLITICA_DEFAULT.zonas.map((zona) => ({ ...zona })),
    metas: POLITICA_DEFAULT.metas.map((meta) => ({ ...meta })),
  };
}

export function leerPoliticaDemo(localSlug: string): PoliticaLocalDemo {
  const fallback = politicaDefaultPara(localSlug);
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(`urnight.politica.${localSlug}`);
    return raw ? (JSON.parse(raw) as PoliticaLocalDemo) : fallback;
  } catch {
    return fallback;
  }
}

export function guardarPoliticaDemo(politica: PoliticaLocalDemo): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(`urnight.politica.${politica.localSlug}`, JSON.stringify(politica));
  } catch {
    /* storage bloqueado: la política conserva el estado en memoria del consumidor */
  }
}
