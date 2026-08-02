import { describe, expect, it } from 'vitest';
import {
  RESCAN_WINDOW_MS,
  shouldIgnoreScan,
  VERDICT_AUTOCLOSE_MS,
  VERDICT_STYLES,
  type Verdict,
} from './scan-rules';
import { color } from './theme';

describe('shouldIgnoreScan', () => {
  it('deja pasar el primer escaneo', () => {
    expect(shouldIgnoreScan('QR-A', null, 1_000)).toBe(false);
  });

  it('ignora el mismo código dentro de la ventana', () => {
    const last = { code: 'QR-A', at: 1_000 };
    expect(shouldIgnoreScan('QR-A', last, 1_000 + RESCAN_WINDOW_MS - 1)).toBe(true);
  });

  it('vuelve a aceptar el mismo código pasada la ventana', () => {
    const last = { code: 'QR-A', at: 1_000 };
    expect(shouldIgnoreScan('QR-A', last, 1_000 + RESCAN_WINDOW_MS)).toBe(false);
  });

  it('deja pasar un código distinto de inmediato', () => {
    const last = { code: 'QR-A', at: 1_000 };
    expect(shouldIgnoreScan('QR-B', last, 1_001)).toBe(false);
  });
});

describe('VERDICT_STYLES', () => {
  it('solo el acceso permitido se cierra solo', () => {
    const autoCierran = (Object.keys(VERDICT_STYLES) as Verdict[]).filter(
      (v) => VERDICT_STYLES[v].autoClose,
    );
    expect(autoCierran).toEqual(['valid']);
  });

  it('el aviso offline espera toque: es un pendiente, no un adelante', () => {
    expect(VERDICT_STYLES.offline.autoClose).toBe(false);
    expect(VERDICT_STYLES.offline.haptic).toBe('warning');
  });

  it('los rechazos vibran como error', () => {
    for (const v of ['already_used', 'cancelled', 'invalid', 'error'] as const) {
      expect(VERDICT_STYLES[v].haptic).toBe('error');
    }
  });

  it('usa texto oscuro sobre verde y ámbar, y claro sobre rojo', () => {
    expect(VERDICT_STYLES.valid.foreground).toBe(color.bgRoot);
    expect(VERDICT_STYLES.offline.foreground).toBe(color.bgRoot);
    expect(VERDICT_STYLES.invalid.foreground).toBe(color.textOnAccent);
  });

  it('toma los fondos de los tokens del DS, no de colores crudos', () => {
    expect(VERDICT_STYLES.valid.background).toBe(color.success);
    expect(VERDICT_STYLES.offline.background).toBe(color.warning);
    expect(VERDICT_STYLES.already_used.background).toBe(color.error);
  });

  it('el auto-cierre da tiempo de leer sin frenar la cola', () => {
    expect(VERDICT_AUTOCLOSE_MS).toBe(1500);
  });
});
