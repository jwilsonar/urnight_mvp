import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { notification } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { NotificationRecord, NotificationRepository } from '../../domain/ports/ops.ports';

@Injectable()
export class DrizzleNotificationRepository implements NotificationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async listByUser(userId: string): Promise<NotificationRecord[]> {
    const rows = await this.db
      .select()
      .from(notification)
      .where(eq(notification.userId, userId))
      .orderBy(desc(notification.createdAt));
    return rows.map((r) => ({
      id: r.id,
      channel: r.channel as 'email' | 'push',
      type: r.type,
      subject: r.subject,
      status: r.status as 'queued' | 'sent' | 'failed',
      createdAt: r.createdAt,
    }));
  }
}
