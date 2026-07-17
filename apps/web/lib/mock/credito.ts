/**
 * DATOS DEMO — crédito de consumo originado por una reserva.
 * Este módulo se reemplazará por fetchers de lib/api/ cuando exista el backend;
 * los nombres camelCase ya están alineados a los contratos futuros.
 */

export interface CreditoConsumoDemo {
  reservaId: string;
  localSlug: string;
  montoInicial: number;
  saldo: number;
}

function creditoKey(localSlug: string): string {
  return `urnight.credito.${localSlug}`;
}

function guardarCreditoDemo(credito: CreditoConsumoDemo): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(creditoKey(credito.localSlug), JSON.stringify(credito));
  } catch {
    /* storage bloqueado: el crédito no persiste fuera de esta operación */
  }
}

export function otorgarCreditoDemo(
  reservaId: string,
  localSlug: string,
  monto: number,
): CreditoConsumoDemo {
  const montoInicial = Math.max(0, monto);
  const credito = { reservaId, localSlug, montoInicial, saldo: montoInicial };
  guardarCreditoDemo(credito);
  return credito;
}

export function leerCreditoDemo(localSlug: string): CreditoConsumoDemo | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(creditoKey(localSlug));
    return raw ? (JSON.parse(raw) as CreditoConsumoDemo) : null;
  } catch {
    return null;
  }
}

export function consumirCreditoDemo(localSlug: string, monto: number): number {
  const credito = leerCreditoDemo(localSlug);
  if (!credito) return 0;

  const descontado = Math.min(Math.max(0, monto), Math.max(0, credito.saldo));
  guardarCreditoDemo({ ...credito, saldo: Math.max(0, credito.saldo - descontado) });
  return descontado;
}
