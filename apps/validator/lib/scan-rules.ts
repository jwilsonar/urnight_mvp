/**
 * Reglas puras de la pantalla de escaneo. Sin imports de Expo ni de React
 * Native (los tokens del DS son TypeScript plano): se prueban en Vitest, misma
 * regla que `session-rules.ts`.
 */
import { color } from './theme';

/** Cuánto queda en pantalla un acceso permitido antes de volver a la cámara. */
export const VERDICT_AUTOCLOSE_MS = 1500;

/**
 * Ventana de dedupe. Al cerrarse solo el veredicto, la cámara vuelve a tener el
 * mismo QR delante y lo revalidaría al instante: segunda pasada que el backend
 * responde already_used, con vibración de rechazo y un pendiente falso en la
 * cola si además no hay red.
 */
export const RESCAN_WINDOW_MS = 5000;

/** Los cuatro veredictos del backend más los dos que decide el cliente. */
export type Verdict = 'valid' | 'already_used' | 'cancelled' | 'invalid' | 'offline' | 'error';

export interface VerdictStyle {
  label: string;
  mark: string;
  background: string;
  foreground: string;
  haptic: 'success' | 'warning' | 'error';
  autoClose: boolean;
}

/**
 * Presentación de cada veredicto. El contraste manda sobre la simetría: blanco
 * sobre el ámbar del DS da ~2:1 y en puerta no se lee, así que success y
 * warning llevan texto obsidiana y solo error lleva texto claro.
 */
export const VERDICT_STYLES: Record<Verdict, VerdictStyle> = {
  valid: {
    label: 'Acceso permitido',
    mark: '✓',
    background: color.success,
    foreground: color.bgRoot,
    haptic: 'success',
    autoClose: true,
  },
  already_used: {
    label: 'Ya usada',
    mark: '✕',
    background: color.error,
    foreground: color.textOnAccent,
    haptic: 'error',
    autoClose: false,
  },
  cancelled: {
    label: 'Cancelada',
    mark: '✕',
    background: color.error,
    foreground: color.textOnAccent,
    haptic: 'error',
    autoClose: false,
  },
  invalid: {
    label: 'Inválida',
    mark: '✕',
    background: color.error,
    foreground: color.textOnAccent,
    haptic: 'error',
    autoClose: false,
  },
  offline: {
    label: 'Guardado offline',
    mark: '⏱',
    background: color.warning,
    foreground: color.bgRoot,
    haptic: 'warning',
    autoClose: false,
  },
  error: {
    label: 'Error',
    mark: '✕',
    background: color.error,
    foreground: color.textOnAccent,
    haptic: 'error',
    autoClose: false,
  },
};

export interface LastScan {
  code: string;
  at: number;
}

/** ¿Ignorar este escaneo por repetido? Mismo código dentro de la ventana. */
export function shouldIgnoreScan(code: string, last: LastScan | null, now: number): boolean {
  if (!last || last.code !== code) return false;
  return now - last.at < RESCAN_WINDOW_MS;
}
