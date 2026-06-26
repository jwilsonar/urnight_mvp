import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RecordAnalyticsDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import {
  ANALYTICS_EVENT_REPOSITORY,
  type AnalyticsEventRepository,
} from '../../domain/ports/ops.ports';

/** Caso de uso: ingesta de evento de analítica (sin PII sensible). */
@Injectable()
export class RecordAnalyticsUseCase {
  private readonly log = createLogger(RecordAnalyticsUseCase.name);

  constructor(
    @Inject(ANALYTICS_EVENT_REPOSITORY) private readonly analytics: AnalyticsEventRepository,
  ) {}

  async execute(input: { dto: RecordAnalyticsDto; userId: string | null }): Promise<void> {
    await this.analytics.record({
      id: randomUUID(),
      userId: input.userId,
      sessionId: input.dto.sessionId ?? null,
      eventName: input.dto.eventName,
      eventId: input.dto.eventId ?? null,
      localId: input.dto.localId ?? null,
      zoneId: input.dto.zoneId ?? null,
      properties: input.dto.properties ?? null,
    });
    this.log.debug({ eventName: input.dto.eventName, eventId: input.dto.eventId ?? null }, 'ops.analytics.recorded');
  }
}
