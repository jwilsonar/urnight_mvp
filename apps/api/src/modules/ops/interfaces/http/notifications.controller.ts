import { Controller, Get } from '@nestjs/common';
import type { NotificationResponse } from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { ListMyNotificationsUseCase } from '../../application/use-cases/list-my-notifications.use-case';

/** Notificaciones del usuario. /api/v1/notifications. */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly listMyNotifications: ListMyNotificationsUseCase) {}

  @Get('me')
  async mine(@CurrentUser() user: AuthUser): Promise<NotificationResponse[]> {
    const items = await this.listMyNotifications.execute(user.id);
    return items.map((n) => ({
      id: n.id,
      channel: n.channel,
      type: n.type,
      subject: n.subject,
      status: n.status,
      createdAt: n.createdAt.toISOString(),
    }));
  }
}
