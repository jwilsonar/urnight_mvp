import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { GenerateRedemptionCodeDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import {
  AllocationExhaustedError,
  AllocationNotFoundError,
  AssignmentForbiddenError,
  PromoCodeNotFoundError,
  PromoterEventNotFoundError,
  PromoterNotFoundError,
} from '../../domain/errors/promoters.errors';
import {
  PROMO_CODE_REPOSITORY,
  type PromoCodeRepository,
  type RedemptionCodeView,
} from '../../domain/ports/promo-code.repository';
import {
  PROMOTER_EVENT_REPOSITORY,
  type PromoterEventRepository,
} from '../../domain/ports/promoter-event.repository';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';
import { generateReadableCode } from '../services/readable-code';

/**
 * Caso de uso (promotor): genera un código single-use para un tipo de entrada de
 * una asignación suya. Consume 1 del cupo (`allocated_stock`). Snapshot del
 * descuento de la allocation; el código es legible y único.
 */
@Injectable()
export class GenerateRedemptionCodeUseCase {
  private readonly log = createLogger(GenerateRedemptionCodeUseCase.name);

  constructor(
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(PROMOTER_EVENT_REPOSITORY) private readonly promoterEvents: PromoterEventRepository,
    @Inject(PROMO_CODE_REPOSITORY) private readonly promoCodes: PromoCodeRepository,
  ) {}

  async execute(input: { userId: string; dto: GenerateRedemptionCodeDto }): Promise<RedemptionCodeView> {
    const promoter = await this.promoters.findActiveByUserId(input.userId);
    if (!promoter) throw new PromoterNotFoundError();

    const header = await this.promoterEvents.findHeader(input.dto.promoterEventId);
    if (!header || header.status !== 'active') throw new PromoterEventNotFoundError();
    if (header.promoterId !== promoter.id) throw new AssignmentForbiddenError();

    const alloc = await this.promoterEvents.getAllocation(
      input.dto.promoterEventId,
      input.dto.ticketTypeId,
    );
    if (!alloc) throw new AllocationNotFoundError();
    if (alloc.remaining <= 0) throw new AllocationExhaustedError();

    const id = randomUUID();
    const code = await this.uniqueCode();
    await this.promoCodes.createGenerated({
      id,
      code,
      discountType: alloc.discountType,
      discountValue: alloc.discountValue,
      eventId: alloc.eventId,
      ticketTypeId: alloc.ticketTypeId,
      promoterId: promoter.id,
      promoterEventId: input.dto.promoterEventId,
      createdBy: input.userId,
    });

    const created = (await this.promoCodes.listByPromoterEvent(input.dto.promoterEventId)).find(
      (c) => c.id === id,
    );
    if (!created) throw new PromoCodeNotFoundError();
    this.log.info(
      { promoterId: promoter.id, promoterEventId: input.dto.promoterEventId, code },
      'promoters.promo_code.generated',
    );
    return created;
  }

  private async uniqueCode(): Promise<string> {
    for (let i = 0; i < 6; i++) {
      const code = generateReadableCode();
      if (!(await this.promoCodes.existsByCode(code))) return code;
    }
    // Colisiones improbables: alarga el código.
    return `${generateReadableCode()}${generateReadableCode().slice(0, 2)}`;
  }
}
