import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import {
  InMemoryPromoterRepository,
  InMemoryReferralLinkRepository,
} from '../../../../shared/testing/in-memory/promoters';
import { PromoterBuilder } from '../../../../shared/testing/builders/promoters';
import { captureEvents } from '../../../../shared/testing/fakes';
import { fakeUnitOfWork } from '../../../../shared/testing/fakes/fake-unit-of-work';
import {
  AssociationForbiddenError,
  AssociationNotPendingError,
  PromoterNotFoundError,
} from '../../domain/errors/promoters.errors';
import { ConfirmPromoterAssociationUseCase } from './confirm-promoter-association.use-case';

function build() {
  const links = new InMemoryReferralLinkRepository();
  const promoters = new InMemoryPromoterRepository(links);
  const bus = new EventBus();
  const captured = captureEvents(bus, 'promoters.association_confirmed');
  const useCase = new ConfirmPromoterAssociationUseCase(promoters, links, fakeUnitOfWork(), bus);
  return { promoters, links, captured, useCase };
}

const pending = () =>
  new PromoterBuilder()
    .withId('p1')
    .withCompanyId('c1')
    .withLocalId('l1')
    .asPending('invitado@example.com')
    .build();

describe('ConfirmPromoterAssociationUseCase', () => {
  it('el invitado confirma → activo, ligado a su userId, con link de referido y evento', async () => {
    const { promoters, captured, useCase } = build();
    promoters.seed(pending());

    const { promoter, link } = await useCase.execute({
      promoterId: 'p1',
      actorUserId: 'user-1',
      actorEmail: 'invitado@example.com',
    });

    expect(promoter.status).toBe('active');
    expect(promoter.userId).toBe('user-1');
    expect(link.promoterId).toBe('p1');
    expect(link.url).toContain(`/r/${link.code}`);
    expect(await promoters.getLink('p1')).not.toBeNull();
    expect(captured.byName('promoters.association_confirmed')).toHaveLength(1);
  });

  it('matchea por userId aunque el correo no coincida', async () => {
    const { promoters, useCase } = build();
    promoters.seed(new PromoterBuilder().withId('p1').asPending('x@y.com').withUserId('user-1').build());

    const { promoter } = await useCase.execute({
      promoterId: 'p1',
      actorUserId: 'user-1',
      actorEmail: 'otro@correo.com',
    });

    expect(promoter.status).toBe('active');
  });

  it('promotor inexistente → PromoterNotFoundError', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ promoterId: 'ghost', actorUserId: 'u', actorEmail: null }),
    ).rejects.toBeInstanceOf(PromoterNotFoundError);
  });

  it('asociación ya no pendiente (activa) → AssociationNotPendingError', async () => {
    const { promoters, useCase } = build();
    promoters.seed(new PromoterBuilder().withId('p1').withStatus('active').build());

    await expect(
      useCase.execute({ promoterId: 'p1', actorUserId: 'u', actorEmail: 'invitado@example.com' }),
    ).rejects.toBeInstanceOf(AssociationNotPendingError);
  });

  it('un tercero (no el invitado) NO puede confirmar → AssociationForbiddenError', async () => {
    const { promoters, captured, useCase } = build();
    promoters.seed(pending());

    await expect(
      useCase.execute({ promoterId: 'p1', actorUserId: 'intruso', actorEmail: 'otro@correo.com' }),
    ).rejects.toBeInstanceOf(AssociationForbiddenError);
    expect(captured.events).toHaveLength(0);
  });
});
