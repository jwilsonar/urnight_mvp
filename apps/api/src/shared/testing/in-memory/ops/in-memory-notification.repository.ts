import type {
  NotificationRecord,
  NotificationRepository,
} from '../../../../modules/ops/domain/ports/ops.ports';

/** Fila interna: el puerto sólo expone `NotificationRecord` (sin `userId`),
 *  pero `listByUser` filtra por usuario, así que lo guardamos aparte. */
interface StoredNotification extends NotificationRecord {
  userId: string;
}

/**
 * NotificationRepository en memoria. Replica el adapter Drizzle: `listByUser`
 * filtra por `userId` y ordena por `createdAt` descendente (más reciente
 * primero, igual que `orderBy(desc(createdAt))`). No extiende la base porque
 * necesita conservar el `userId` fuera del `NotificationRecord` devuelto.
 */
export class InMemoryNotificationRepository implements NotificationRepository {
  private readonly rows: StoredNotification[] = [];

  /** Precarga una notificación de un usuario (datos de referencia). */
  seed(userId: string, record: NotificationRecord): this {
    this.rows.push({ ...record, userId });
    return this;
  }

  async listByUser(userId: string): Promise<NotificationRecord[]> {
    return this.rows
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(({ userId: _userId, ...record }) => record);
  }

  get size(): number {
    return this.rows.length;
  }
}
