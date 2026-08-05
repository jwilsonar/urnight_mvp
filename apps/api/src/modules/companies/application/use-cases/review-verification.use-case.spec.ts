import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { captureEvents } from '../../../../shared/testing/fakes/capture-events';
import {
  InMemoryLocalRepository,
  InMemoryLocalVerificationRepository,
} from '../../../../shared/testing/in-memory/companies';
import {
  LocalBuilder,
  LocalVerificationBuilder,
} from '../../../../shared/testing/builders/companies';
import {
  LocalNotFoundError,
  VerificationNotFoundError,
} from '../../domain/errors/companies.errors';
import type { GetLocalVerificationStatusUseCase } from './get-local-verification-status.use-case';
import { ReviewVerificationUseCase } from './review-verification.use-case';

function build() {
  const verifications = new InMemoryLocalVerificationRepository();
  const locals = new InMemoryLocalRepository();
  const events = new EventBus();
  const getDocumentStatus = {
    execute: async () => null,
  } as unknown as GetLocalVerificationStatusUseCase;
  const useCase = new ReviewVerificationUseCase(
    verifications,
    locals,
    events,
    getDocumentStatus,
  );
  return { verifications, locals, events, useCase };
}

describe('ReviewVerificationUseCase', () => {
  it('aprobar marca el local como verificado y emite LocalVerifiedEvent(true)', async () => {
    const { verifications, locals, events, useCase } = build();
    await locals.create(new LocalBuilder().withId('l1').build());
    await verifications.create(
      new LocalVerificationBuilder().withId('v1').withLocalId('l1').build(),
    );
    const captured = captureEvents(events, 'companies.local_verified');

    const result = await useCase.execute({
      verificationId: 'v1',
      reviewerId: 'admin',
      dto: { decision: 'approved' },
    });

    expect(result.status).toBe('approved');
    expect(result.reviewedAt).toBeInstanceOf(Date);
    expect((await locals.findById('l1'))?.isVerified).toBe(true);
    expect(captured.last()?.payload).toEqual({ localId: 'l1', verified: true });
  });

  it('observar NO verifica el local y emite LocalVerifiedEvent(false)', async () => {
    const { verifications, locals, events, useCase } = build();
    await locals.create(new LocalBuilder().withId('l1').asVerified().build());
    await verifications.create(
      new LocalVerificationBuilder().withId('v1').withLocalId('l1').build(),
    );
    const captured = captureEvents(events, 'companies.local_verified');

    const result = await useCase.execute({
      verificationId: 'v1',
      reviewerId: 'admin',
      dto: { decision: 'observed', notes: 'Falta plano' },
    });

    expect(result.status).toBe('observed');
    expect((await locals.findById('l1'))?.isVerified).toBe(false);
    expect(captured.last()?.payload).toEqual({ localId: 'l1', verified: false });
  });

  it('verificación inexistente → VerificationNotFoundError', async () => {
    const { useCase } = build();

    await expect(
      useCase.execute({ verificationId: 'ghost', reviewerId: 'a', dto: { decision: 'approved' } }),
    ).rejects.toBeInstanceOf(VerificationNotFoundError);
  });

  it('local de la verificación inexistente → LocalNotFoundError', async () => {
    const { verifications, useCase } = build();
    await verifications.create(
      new LocalVerificationBuilder().withId('v1').withLocalId('missing').build(),
    );

    await expect(
      useCase.execute({ verificationId: 'v1', reviewerId: 'a', dto: { decision: 'approved' } }),
    ).rejects.toBeInstanceOf(LocalNotFoundError);
  });
});
