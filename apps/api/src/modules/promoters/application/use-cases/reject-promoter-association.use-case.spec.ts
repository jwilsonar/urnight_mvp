import { describe, expect, it } from 'vitest';
import { InMemoryPromoterRepository } from '../../../../shared/testing/in-memory/promoters';
import { PromoterBuilder } from '../../../../shared/testing/builders/promoters';
import {
  AssociationForbiddenError,
  AssociationNotPendingError,
  PromoterNotFoundError,
} from '../../domain/errors/promoters.errors';
import { RejectPromoterAssociationUseCase } from './reject-promoter-association.use-case';

function build() {
  const promoters = new InMemoryPromoterRepository();
  const useCase = new RejectPromoterAssociationUseCase(promoters);
  return { promoters, useCase };
}

const pending = () =>
  new PromoterBuilder().withId('p1').asPending('invitado@example.com').build();

describe('RejectPromoterAssociationUseCase', () => {
  it('el invitado rechaza → promotor inactivo (sin rol ni link)', async () => {
    const { promoters, useCase } = build();
    promoters.seed(pending());

    const promoter = await useCase.execute({
      promoterId: 'p1',
      actorUserId: 'user-1',
      actorEmail: 'invitado@example.com',
    });

    expect(promoter.status).toBe('inactive');
    expect(await promoters.getLink('p1')).toBeNull();
  });

  it('promotor inexistente → PromoterNotFoundError', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ promoterId: 'ghost', actorUserId: 'u', actorEmail: null }),
    ).rejects.toBeInstanceOf(PromoterNotFoundError);
  });

  it('asociación ya no pendiente → AssociationNotPendingError', async () => {
    const { promoters, useCase } = build();
    promoters.seed(new PromoterBuilder().withId('p1').asInactive().build());

    await expect(
      useCase.execute({ promoterId: 'p1', actorUserId: 'u', actorEmail: 'invitado@example.com' }),
    ).rejects.toBeInstanceOf(AssociationNotPendingError);
  });

  it('un tercero NO puede rechazar → AssociationForbiddenError', async () => {
    const { promoters, useCase } = build();
    promoters.seed(pending());

    await expect(
      useCase.execute({ promoterId: 'p1', actorUserId: 'intruso', actorEmail: 'otro@correo.com' }),
    ).rejects.toBeInstanceOf(AssociationForbiddenError);
  });
});
