import { describe, expect, it } from 'vitest';
import { InMemoryNotificationRepository } from '../../../../shared/testing/in-memory/ops';
import type { NotificationRecord } from '../../domain/ports/ops.ports';
import { ListMyNotificationsUseCase } from './list-my-notifications.use-case';

function build() {
  const notifications = new InMemoryNotificationRepository();
  const useCase = new ListMyNotificationsUseCase(notifications);
  return { notifications, useCase };
}

const record = (over: Partial<NotificationRecord> = {}): NotificationRecord => ({
  id: 'n1',
  channel: 'email',
  type: 'order.paid',
  subject: 'Tu compra fue confirmada',
  status: 'sent',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  ...over,
});

describe('ListMyNotificationsUseCase', () => {
  it('devuelve las notificaciones del usuario indicado', async () => {
    const { notifications, useCase } = build();
    notifications.seed('user-1', record({ id: 'n1' }));
    notifications.seed('user-2', record({ id: 'otro' }));

    const result = await useCase.execute('user-1');

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('n1');
  });

  it('ordena por createdAt descendente (más reciente primero)', async () => {
    const { notifications, useCase } = build();
    notifications.seed('user-1', record({ id: 'vieja', createdAt: new Date('2026-01-01T00:00:00Z') }));
    notifications.seed('user-1', record({ id: 'nueva', createdAt: new Date('2026-03-01T00:00:00Z') }));

    const result = await useCase.execute('user-1');

    expect(result.map((n) => n.id)).toEqual(['nueva', 'vieja']);
  });

  it('devuelve lista vacía cuando el usuario no tiene notificaciones', async () => {
    const { useCase } = build();
    expect(await useCase.execute('sin-notifs')).toEqual([]);
  });
});
