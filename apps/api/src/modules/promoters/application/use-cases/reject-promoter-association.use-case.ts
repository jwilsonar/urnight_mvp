import { Inject, Injectable } from '@nestjs/common';
import { Promoter } from '../../domain/entities/promoter.entity';
import {
  AssociationForbiddenError,
  AssociationNotPendingError,
  PromoterNotFoundError,
} from '../../domain/errors/promoters.errors';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';

export interface RejectAssociationInput {
  promoterId: string;
  actorUserId: string;
  actorEmail: string | null;
}

/**
 * Caso de uso: la persona invitada rechaza la asociación. El promotor queda
 * `inactive` (no se otorga rol ni link). Solo el invitado puede rechazar.
 */
@Injectable()
export class RejectPromoterAssociationUseCase {
  constructor(@Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository) {}

  async execute(input: RejectAssociationInput): Promise<Promoter> {
    const promoter = await this.promoters.findById(input.promoterId);
    if (!promoter) throw new PromoterNotFoundError();
    if (!promoter.isPending()) throw new AssociationNotPendingError();
    if (!promoter.belongsToInvited(input.actorUserId, input.actorEmail)) {
      throw new AssociationForbiddenError();
    }
    promoter.reject();
    await this.promoters.update(promoter);
    return promoter;
  }
}
