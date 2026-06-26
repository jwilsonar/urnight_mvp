import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRecord,
  type NotificationRepository,
} from '../../domain/ports/ops.ports';

/** Caso de uso: notificaciones del usuario. */
@Injectable()
export class ListMyNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepository,
  ) {}

  execute(userId: string): Promise<NotificationRecord[]> {
    return this.notifications.listByUser(userId);
  }
}
