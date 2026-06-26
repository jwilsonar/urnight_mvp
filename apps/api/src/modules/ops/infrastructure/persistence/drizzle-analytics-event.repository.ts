import { Inject, Injectable } from '@nestjs/common';
import { analyticsEvent } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { AnalyticsEventInput, AnalyticsEventRepository } from '../../domain/ports/ops.ports';

@Injectable()
export class DrizzleAnalyticsEventRepository implements AnalyticsEventRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async record(event: AnalyticsEventInput): Promise<void> {
    await this.db.insert(analyticsEvent).values({
      id: event.id,
      userId: event.userId,
      sessionId: event.sessionId,
      eventName: event.eventName,
      eventId: event.eventId,
      localId: event.localId,
      zoneId: event.zoneId,
      properties: event.properties,
    });
  }
}
