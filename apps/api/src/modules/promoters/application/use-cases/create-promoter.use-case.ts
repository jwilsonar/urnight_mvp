import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreatePromoterDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { Promoter } from '../../domain/entities/promoter.entity';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';

/** Datos del DTO + la empresa del actor (derivada del token, no del cliente). */
export interface CreatePromoterInput extends CreatePromoterDto {
  companyId: string;
}

export interface CreatePromoterResult {
  promoter: Promoter;
}

/**
 * Caso de uso: invitar a una persona a ser promotor de la empresa del actor
 * (admin_local). Crea el promotor en estado `pending` SIN link de referido; la
 * persona debe confirmar la asociación desde su panel (regla de negocio:
 * consentimiento del promotor). El link de referido se genera al confirmar.
 */
@Injectable()
export class CreatePromoterUseCase {
  private readonly log = createLogger(CreatePromoterUseCase.name);

  constructor(@Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository) {}

  async execute(input: CreatePromoterInput): Promise<CreatePromoterResult> {
    const promoter = Promoter.invite({
      id: randomUUID(),
      companyId: input.companyId,
      localId: input.localId ?? null,
      name: input.name,
      invitedEmail: input.email,
      contactPhone: input.contactPhone ?? null,
    });
    await this.promoters.createPending(promoter);
    this.log.info({ promoterId: promoter.id }, 'promoters.promoter.created');
    return { promoter };
  }
}
