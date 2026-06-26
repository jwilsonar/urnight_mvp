import { describe, expect, it } from 'vitest';
import { InMemoryReferralLinkRepository } from '../../../../shared/testing/in-memory/promoters';
import { ReferralLinkBuilder } from '../../../../shared/testing/builders/promoters';
import { RegisterReferralClickUseCase } from './register-referral-click.use-case';

function build() {
  const links = new InMemoryReferralLinkRepository();
  const useCase = new RegisterReferralClickUseCase(links);
  return { links, useCase };
}

describe('RegisterReferralClickUseCase', () => {
  it('incrementa el contador de clics del link por código', async () => {
    const { links, useCase } = build();
    links.seed(new ReferralLinkBuilder().withCode('CLICK1').withClicks(2).build());

    await useCase.execute('CLICK1');

    expect((await links.findByCode('CLICK1'))?.clicks).toBe(3);
  });

  it('acumula múltiples clics consecutivos', async () => {
    const { links, useCase } = build();
    links.seed(new ReferralLinkBuilder().withCode('CLICK2').withClicks(0).build());

    await useCase.execute('CLICK2');
    await useCase.execute('CLICK2');

    expect((await links.findByCode('CLICK2'))?.clicks).toBe(2);
  });

  it('código inexistente → no-op silencioso (best-effort, sin lanzar)', async () => {
    const { useCase } = build();
    await expect(useCase.execute('GHOST')).resolves.toBeUndefined();
  });
});
