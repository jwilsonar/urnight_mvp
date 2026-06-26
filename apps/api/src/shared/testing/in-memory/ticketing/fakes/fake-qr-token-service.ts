/**
 * Generador de tokens QR determinista para los tests. El checkout real produce
 * el QR con `randomBytes` (único e impredecible); aquí emitimos un token estable
 * y único por contador para poder afirmar igualdad/unicidad sin azar. NO se
 * cablea al caso de uso (que genera el QR internamente): se usa en
 * builders/mothers para QR predecibles en los tests.
 */
export class FakeQrTokenService {
  private counter = 0;

  constructor(private readonly prefix = 'qr') {}

  /** Devuelve un token único y determinista (`qr-0`, `qr-1`, ...). */
  next(): string {
    const token = `${this.prefix}-${this.counter}`;
    this.counter += 1;
    return token;
  }

  /** Token determinista para un identificador dado (estable entre llamadas). */
  forId(id: string): string {
    return `${this.prefix}-${id}`;
  }
}
