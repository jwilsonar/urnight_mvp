import { describe, expect, it } from 'vitest';
import { Review } from './review.entity';
import { ReviewBuilder } from '../../../../shared/testing/builders/trust';
import { ReviewMother } from '../../../../shared/testing/mothers/trust';

describe('Review (aggregate reseña §4.1)', () => {
  it('create() inicializa una reseña verificada, publicada y no reportada para un local', () => {
    const review = Review.create({
      id: 'rev-1',
      userId: 'user-1',
      targetType: 'local',
      localId: 'local-1',
      eventId: null,
      ticketId: 'ticket-1',
      rating: 5,
      comment: 'Excelente',
      quickTags: ['ambiente'],
      isVerified: true,
    });

    expect(review.id).toBe('rev-1');
    expect(review.userId).toBe('user-1');
    expect(review.targetType).toBe('local');
    expect(review.localId).toBe('local-1');
    expect(review.eventId).toBeNull();
    expect(review.ticketId).toBe('ticket-1');
    expect(review.rating).toBe(5);
    expect(review.comment).toBe('Excelente');
    expect(review.quickTags).toEqual(['ambiente']);
    expect(review.isVerified).toBe(true);
    expect(review.status).toBe('published');
    expect(review.createdAt).toBeInstanceOf(Date);
  });

  it('create() aplica defaults: comment/quickTags null cuando se omiten', () => {
    const review = Review.create({
      id: 'rev-2',
      userId: 'user-1',
      targetType: 'event',
      eventId: 'event-1',
      ticketId: 'ticket-1',
      rating: 3,
      isVerified: true,
    });

    expect(review.targetType).toBe('event');
    expect(review.eventId).toBe('event-1');
    expect(review.localId).toBeNull();
    expect(review.comment).toBeNull();
    expect(review.quickTags).toBeNull();
    expect(review.status).toBe('published');
  });

  it('target polimórfico: una reseña de local mantiene eventId null', () => {
    const review = ReviewMother.forLocal('local-9');
    expect(review.localId).toBe('local-9');
    expect(review.eventId).toBeNull();
  });

  it('target polimórfico: una reseña de evento mantiene localId null', () => {
    const review = ReviewMother.forEvent('event-9');
    expect(review.eventId).toBe('event-9');
    expect(review.localId).toBeNull();
  });

  it('hide() transiciona el estado de published a hidden', () => {
    const review = new ReviewBuilder().withStatus('published').build();
    expect(review.status).toBe('published');
    review.hide();
    expect(review.status).toBe('hidden');
  });

  it('hide() es idempotente: ocultar una reseña ya oculta la deja en hidden', () => {
    const review = new ReviewBuilder().asHidden().build();
    review.hide();
    expect(review.status).toBe('hidden');
  });

  it('fromPersistence() rehidrata todos los campos sin alterarlos', () => {
    const createdAt = new Date('2026-03-01T12:00:00Z');
    const review = Review.fromPersistence({
      id: 'rev-3',
      userId: 'user-7',
      targetType: 'event',
      localId: null,
      eventId: 'event-3',
      ticketId: 'ticket-3',
      rating: 2,
      comment: 'Regular',
      quickTags: null,
      isVerified: true,
      isReported: true,
      status: 'hidden',
      createdAt,
    });

    expect(review.id).toBe('rev-3');
    expect(review.rating).toBe(2);
    expect(review.status).toBe('hidden');
    expect(review.createdAt).toBe(createdAt);
  });
});
