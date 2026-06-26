import { describe, expect, it } from 'vitest';
import { InMemoryPromoterRepository } from '../../../../shared/testing/in-memory/promoters';
import {
  CreatePromoterUseCase,
  type CreatePromoterInput,
} from './create-promoter.use-case';

function build() {
  const promoters = new InMemoryPromoterRepository();
  const useCase = new CreatePromoterUseCase(promoters);
  return { promoters, useCase };
}

const input: CreatePromoterInput = {
  companyId: '22222222-2222-2222-2222-222222222222',
  localId: '33333333-3333-3333-3333-333333333333',
  name: 'Promotor Norte',
  email: 'promo@correo.com',
};

describe('CreatePromoterUseCase (invitación)', () => {
  it('crea el promotor en estado pending, sin link, ligado al correo invitado', async () => {
    const { promoters, useCase } = build();

    const { promoter } = await useCase.execute(input);

    expect(promoter.name).toBe('Promotor Norte');
    expect(promoter.status).toBe('pending');
    expect(promoter.companyId).toBe(input.companyId);
    expect(promoter.invitedEmail).toBe('promo@correo.com');
    expect(promoter.userId).toBeNull();
    expect(promoters.size).toBe(1);
  });

  it('no genera referral link hasta que el promotor confirme', async () => {
    const { promoters, useCase } = build();

    const { promoter } = await useCase.execute(input);

    expect(await promoters.getLink(promoter.id)).toBeNull();
  });

  it('normaliza el correo invitado a minúsculas (clave de match)', async () => {
    const { useCase } = build();

    const { promoter } = await useCase.execute({ ...input, email: 'MixedCase@Correo.com' });

    expect(promoter.invitedEmail).toBe('mixedcase@correo.com');
  });
});
