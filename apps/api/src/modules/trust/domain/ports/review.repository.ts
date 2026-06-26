import type { Review } from '../entities/review.entity';

export interface ReviewRepository {
  create(review: Review): Promise<Review>;
  listByTarget(target: { localId?: string; eventId?: string }): Promise<Review[]>;
}

export const REVIEW_REPOSITORY = Symbol('REVIEW_REPOSITORY');

/**
 * Puerto de elegibilidad (ACL hacia ticketing): verifica que el usuario tiene
 * una entrada USADA del local/evento (asistencia comprobada).
 */
export interface AttendanceContext {
  eventId: string;
  localId: string;
}

export interface AttendancePort {
  getUsedTicketContext(userId: string, ticketId: string): Promise<AttendanceContext | null>;
}

export const ATTENDANCE_PORT = Symbol('ATTENDANCE_PORT');
