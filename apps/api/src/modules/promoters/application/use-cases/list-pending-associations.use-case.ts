import { Inject, Injectable } from '@nestjs/common';
import { Promoter } from '../../domain/entities/promoter.entity';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';

export interface ListPendingAssociationsInput {
  actorUserId: string;
  actorEmail: string | null;
}

/**
 * Caso de uso: lista las invitaciones de asociación `pending` dirigidas al actor
 * (por su userId o su correo), para que las acepte o rechace en su panel.
 */
@Injectable()
export class ListPendingAssociationsUseCase {
  constructor(@Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository) {}

  async execute(input: ListPendingAssociationsInput): Promise<Promoter[]> {
    return this.promoters.findPendingForActor(input.actorUserId, input.actorEmail ?? null);
  }
}
