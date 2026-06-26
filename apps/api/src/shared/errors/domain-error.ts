/**
 * Error de dominio base. Las reglas de negocio lanzan subtipos que portan un
 * `status` HTTP y un `code` machine-readable (de @urnight/contracts). El
 * ProblemJsonFilter los normaliza a application/problem+json (§2.2, RFC 7807).
 */
export abstract class DomainError extends Error {
  abstract readonly status: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
