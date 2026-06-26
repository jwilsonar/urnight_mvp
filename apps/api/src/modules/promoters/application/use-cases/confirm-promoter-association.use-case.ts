import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { Promoter } from '../../domain/entities/promoter.entity';
import { ReferralLink } from '../../domain/entities/referral-link.entity';
import {
  AssociationForbiddenError,
  AssociationNotPendingError,
  PromoterNotFoundError,
} from '../../domain/errors/promoters.errors';
import { PromoterAssociationConfirmedEvent } from '../../domain/events/promoters.events';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';
import {
  REFERRAL_LINK_REPOSITORY,
  type ReferralLinkRepository,
} from '../../domain/ports/referral-link.repository';

const REFERRAL_BASE = 'https://urnight.pe/r';

export interface ConfirmAssociationInput {
  promoterId: string;
  actorUserId: string;
  actorEmail: string | null;
}

export interface ConfirmAssociationResult {
  promoter: Promoter;
  link: ReferralLink;
}

/**
 * Caso de uso: la persona invitada confirma la asociación. Liga su userId, pasa
 * el promotor a `active`, genera el link de referido único y publica el evento
 * que hace que Identity le otorgue el rol `promoter` (scope company/local). Solo
 * el invitado (por userId o correo) puede confirmar.
 */
@Injectable()
export class ConfirmPromoterAssociationUseCase {
  constructor(
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(REFERRAL_LINK_REPOSITORY) private readonly links: ReferralLinkRepository,
    private readonly uow: UnitOfWork,
    private readonly events: EventBus,
  ) {}

  async execute(input: ConfirmAssociationInput): Promise<ConfirmAssociationResult> {
    const promoter = await this.promoters.findById(input.promoterId);
    if (!promoter) throw new PromoterNotFoundError();
    if (!promoter.isPending()) throw new AssociationNotPendingError();
    if (!promoter.belongsToInvited(input.actorUserId, input.actorEmail)) {
      throw new AssociationForbiddenError();
    }

    const code = await this.uniqueCode();
    const link = ReferralLink.create({
      id: randomUUID(),
      promoterId: promoter.id,
      code,
      url: `${REFERRAL_BASE}/${code}`,
    });
    promoter.confirm(input.actorUserId);

    await this.uow.run(async (tx) => {
      await this.promoters.update(promoter, tx);
      await this.promoters.addLink(link, tx);
    });

    await this.events.publish(
      new PromoterAssociationConfirmedEvent({
        promoterId: promoter.id,
        userId: input.actorUserId,
        companyId: promoter.companyId,
        localId: promoter.localId,
      }),
    );
    return { promoter, link };
  }

  private async uniqueCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      if (!(await this.links.existsByCode(code))) return code;
    }
    return randomBytes(6).toString('hex').toUpperCase().slice(0, 12);
  }
}
