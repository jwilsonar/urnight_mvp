import { describe, expect, it } from 'vitest';
import {
  InMemoryLocalRepository,
  InMemoryLocalVerificationRepository,
} from '../../../../shared/testing/in-memory/companies';
import { LocalBuilder } from '../../../../shared/testing/builders/companies';
import { LocalNotFoundError } from '../../domain/errors/companies.errors';
import { RequestVerificationUseCase } from './request-verification.use-case';

function build() {
  const locals = new InMemoryLocalRepository();
  const verifications = new InMemoryLocalVerificationRepository();
  const useCase = new RequestVerificationUseCase(locals, verifications);
  return { locals, verifications, useCase };
}

describe('RequestVerificationUseCase', () => {
  it('crea una verificación pending para el local y la persiste', async () => {
    const { locals, verifications, useCase } = build();
    await locals.create(new LocalBuilder().withId('l1').build());

    const verification = await useCase.execute({
      localId: 'l1',
      dto: { licenseReference: 'ITSE-001', validUntil: '2027-01-01' },
      isSuperAdmin: true,
    });

    expect(verification.localId).toBe('l1');
    expect(verification.status).toBe('pending');
    expect(verification.licenseReference).toBe('ITSE-001');
    expect(verification.grantsVerification()).toBe(false);
    expect(verifications.size).toBe(1);
  });

  it('local inexistente → LocalNotFoundError y no crea verificación', async () => {
    const { verifications, useCase } = build();

    await expect(
      useCase.execute({ localId: 'ghost', dto: {}, isSuperAdmin: true }),
    ).rejects.toBeInstanceOf(LocalNotFoundError);
    expect(verifications.size).toBe(0);
  });
});
