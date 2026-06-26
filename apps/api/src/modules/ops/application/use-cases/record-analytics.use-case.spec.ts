import type { RecordAnalyticsDto } from '@urnight/contracts';
import { describe, expect, it } from 'vitest';
import { InMemoryAnalyticsEventRepository } from '../../../../shared/testing/in-memory/ops';
import { RecordAnalyticsUseCase } from './record-analytics.use-case';

function build() {
  const analytics = new InMemoryAnalyticsEventRepository();
  const useCase = new RecordAnalyticsUseCase(analytics);
  return { analytics, useCase };
}

const dto = (over: Partial<RecordAnalyticsDto> = {}): RecordAnalyticsDto => ({
  eventName: 'checkout_started',
  ...over,
});

describe('RecordAnalyticsUseCase', () => {
  it('captura un evento de analítica con el userId del actor', async () => {
    const { analytics, useCase } = build();

    await useCase.execute({ dto: dto(), userId: 'user-1' });

    expect(analytics.size).toBe(1);
    const event = analytics.byName('checkout_started');
    expect(event?.userId).toBe('user-1');
    expect(event?.eventName).toBe('checkout_started');
    expect(event?.id).toBeTypeOf('string');
  });

  it('captura un evento anónimo (userId null) sin PII', async () => {
    const { analytics, useCase } = build();

    await useCase.execute({ dto: dto({ eventName: 'page_view' }), userId: null });

    const event = analytics.last();
    expect(event?.userId).toBeNull();
    expect(event?.eventName).toBe('page_view');
  });

  it('mapea los campos opcionales del DTO (default null) y conserva properties', async () => {
    const { analytics, useCase } = build();

    await useCase.execute({
      dto: dto({
        sessionId: 'sess-1',
        eventId: '11111111-1111-1111-1111-111111111111',
        localId: '22222222-2222-2222-2222-222222222222',
        zoneId: '33333333-3333-3333-3333-333333333333',
        properties: { step: 1 },
      }),
      userId: 'user-1',
    });

    const event = analytics.last();
    expect(event?.sessionId).toBe('sess-1');
    expect(event?.eventId).toBe('11111111-1111-1111-1111-111111111111');
    expect(event?.localId).toBe('22222222-2222-2222-2222-222222222222');
    expect(event?.zoneId).toBe('33333333-3333-3333-3333-333333333333');
    expect(event?.properties).toEqual({ step: 1 });
  });

  it('aplica null a los campos opcionales ausentes del DTO', async () => {
    const { analytics, useCase } = build();
    await useCase.execute({ dto: dto(), userId: 'user-1' });
    const event = analytics.last();
    expect(event?.sessionId).toBeNull();
    expect(event?.eventId).toBeNull();
    expect(event?.localId).toBeNull();
    expect(event?.zoneId).toBeNull();
    expect(event?.properties).toBeNull();
  });
});
