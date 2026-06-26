import { describe, expect, it } from 'vitest';
import {
  FakeAttendancePort,
  InMemoryReviewRepository,
} from '../../../../shared/testing/in-memory/trust';
import { ReviewMother } from '../../../../shared/testing/mothers/trust';
import { ReviewNotEligibleError } from '../../domain/errors/trust.errors';
import { CreateReviewUseCase } from './create-review.use-case';

function build() {
  const reviews = new InMemoryReviewRepository();
  const attendance = new FakeAttendancePort();
  const useCase = new CreateReviewUseCase(reviews, attendance);
  return { reviews, attendance, useCase };
}

describe('CreateReviewUseCase', () => {
  it('crea una reseña verificada de un local cuando hay entrada usada del mismo local', async () => {
    const { reviews, attendance, useCase } = build();
    attendance.setContext('user-1', 'ticket-1', { eventId: 'event-1', localId: 'local-1' });

    const review = await useCase.execute({
      userId: 'user-1',
      dto: ReviewMother.createLocalDto({ localId: 'local-1', ticketId: 'ticket-1', rating: 4 }),
    });

    expect(review.targetType).toBe('local');
    expect(review.localId).toBe('local-1');
    expect(review.eventId).toBeNull();
    expect(review.userId).toBe('user-1');
    expect(review.ticketId).toBe('ticket-1');
    expect(review.rating).toBe(4);
    expect(review.isVerified).toBe(true);
    expect(review.status).toBe('published');
  });

  it('persiste la reseña en el repositorio (estado)', async () => {
    const { reviews, attendance, useCase } = build();
    attendance.setContext('user-1', 'ticket-1', { eventId: 'event-1', localId: 'local-1' });

    const review = await useCase.execute({
      userId: 'user-1',
      dto: ReviewMother.createLocalDto(),
    });

    expect(reviews.size).toBe(1);
    expect(reviews.all[0]?.id).toBe(review.id);
  });

  it('crea una reseña verificada de un evento cuando la entrada usada coincide con el evento', async () => {
    const { attendance, useCase } = build();
    attendance.setContext('user-2', 'ticket-9', { eventId: 'event-7', localId: 'local-7' });

    const review = await useCase.execute({
      userId: 'user-2',
      dto: ReviewMother.createEventDto({ eventId: 'event-7', ticketId: 'ticket-9' }),
    });

    expect(review.targetType).toBe('event');
    expect(review.eventId).toBe('event-7');
    expect(review.localId).toBeNull();
  });

  it('sin entrada usada (no asistente verificado) → ReviewNotEligibleError', async () => {
    const { reviews, useCase } = build();

    await expect(
      useCase.execute({ userId: 'user-1', dto: ReviewMother.createLocalDto() }),
    ).rejects.toBeInstanceOf(ReviewNotEligibleError);
    expect(reviews.size).toBe(0);
  });

  it('entrada usada de OTRO local → ReviewNotEligibleError (target no coincide)', async () => {
    const { useCase, attendance } = build();
    attendance.setContext('user-1', 'ticket-1', { eventId: 'event-1', localId: 'local-OTRO' });

    await expect(
      useCase.execute({
        userId: 'user-1',
        dto: ReviewMother.createLocalDto({ localId: 'local-1', ticketId: 'ticket-1' }),
      }),
    ).rejects.toBeInstanceOf(ReviewNotEligibleError);
  });

  it('entrada usada de OTRO evento → ReviewNotEligibleError (target event no coincide)', async () => {
    const { useCase, attendance } = build();
    attendance.setContext('user-1', 'ticket-1', { eventId: 'event-OTRO', localId: 'local-1' });

    await expect(
      useCase.execute({
        userId: 'user-1',
        dto: ReviewMother.createEventDto({ eventId: 'event-1', ticketId: 'ticket-1' }),
      }),
    ).rejects.toBeInstanceOf(ReviewNotEligibleError);
  });
});
