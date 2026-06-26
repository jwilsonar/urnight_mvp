import type {
  AttendanceContext,
  AttendancePort,
} from '../../../../modules/trust/domain/ports/review.repository';

/**
 * AttendancePort de prueba (ACL hacia ticketing). Configurable: registra el
 * contexto de entrada USADA por par `(userId, ticketId)`. Si no hay registro
 * devuelve `null` — fiel al adapter Drizzle, que devuelve `null` cuando no existe
 * una entrada con estado `used` del usuario (no elegible para reseñar).
 */
export class FakeAttendancePort implements AttendancePort {
  private readonly contexts = new Map<string, AttendanceContext>();

  /** Registra que `(userId, ticketId)` tiene una entrada usada del local/evento. */
  setContext(userId: string, ticketId: string, context: AttendanceContext): this {
    this.contexts.set(this.key(userId, ticketId), context);
    return this;
  }

  async getUsedTicketContext(
    userId: string,
    ticketId: string,
  ): Promise<AttendanceContext | null> {
    return this.contexts.get(this.key(userId, ticketId)) ?? null;
  }

  private key(userId: string, ticketId: string): string {
    return `${userId}::${ticketId}`;
  }
}
