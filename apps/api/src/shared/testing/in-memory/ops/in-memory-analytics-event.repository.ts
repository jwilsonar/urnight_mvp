import type {
  AnalyticsEventInput,
  AnalyticsEventRepository,
} from '../../../../modules/ops/domain/ports/ops.ports';

/**
 * AnalyticsEventRepository en memoria. Replica el adapter Drizzle: `record`
 * persiste el evento de analítica. Conserva los eventos capturados para poder
 * verificar la ingesta en los tests (sin mockear el ORM).
 */
export class InMemoryAnalyticsEventRepository implements AnalyticsEventRepository {
  readonly events: AnalyticsEventInput[] = [];

  async record(event: AnalyticsEventInput): Promise<void> {
    this.events.push(event);
  }

  /** Primer evento capturado con un `eventName` dado (o undefined). */
  byName(eventName: string): AnalyticsEventInput | undefined {
    return this.events.find((e) => e.eventName === eventName);
  }

  /** Último evento capturado (o undefined). */
  last(): AnalyticsEventInput | undefined {
    return this.events[this.events.length - 1];
  }

  get size(): number {
    return this.events.length;
  }
}
