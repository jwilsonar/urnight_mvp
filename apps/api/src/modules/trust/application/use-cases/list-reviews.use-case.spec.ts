import { describe, expect, it } from 'vitest';
import { InMemoryReviewRepository } from '../../../../shared/testing/in-memory/trust';
import { ReviewBuilder } from '../../../../shared/testing/builders/trust';
import { ListReviewsUseCase } from './list-reviews.use-case';

function build() {
  const reviews = new InMemoryReviewRepository();
  const useCase = new ListReviewsUseCase(reviews);
  return { reviews, useCase };
}

describe('ListReviewsUseCase', () => {
  it('lista las reseñas publicadas de un local', async () => {
    const { reviews, useCase } = build();
    reviews.seed(new ReviewBuilder().withId('a').forLocal('local-1').build());
    reviews.seed(new ReviewBuilder().withId('b').forLocal('local-1').build());

    const result = await useCase.execute({ localId: 'local-1' });

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id).sort()).toEqual(['a', 'b']);
  });

  it('excluye reseñas ocultas (status hidden) del listado público', async () => {
    const { reviews, useCase } = build();
    reviews.seed(new ReviewBuilder().withId('pub').forLocal('local-1').build());
    reviews.seed(new ReviewBuilder().withId('oculta').forLocal('local-1').asHidden().build());

    const result = await useCase.execute({ localId: 'local-1' });

    expect(result.map((r) => r.id)).toEqual(['pub']);
  });

  it('filtra por evento sin mezclar reseñas de locales', async () => {
    const { reviews, useCase } = build();
    reviews.seed(new ReviewBuilder().withId('ev').forEvent('event-1').build());
    reviews.seed(new ReviewBuilder().withId('loc').forLocal('local-1').build());

    const result = await useCase.execute({ eventId: 'event-1' });

    expect(result.map((r) => r.id)).toEqual(['ev']);
  });

  it('ordena por createdAt descendente (más reciente primero)', async () => {
    const { reviews, useCase } = build();
    reviews.seed(
      new ReviewBuilder()
        .withId('vieja')
        .forLocal('local-1')
        .withCreatedAt(new Date('2026-01-01T00:00:00Z'))
        .build(),
    );
    reviews.seed(
      new ReviewBuilder()
        .withId('nueva')
        .forLocal('local-1')
        .withCreatedAt(new Date('2026-05-01T00:00:00Z'))
        .build(),
    );

    const result = await useCase.execute({ localId: 'local-1' });

    expect(result.map((r) => r.id)).toEqual(['nueva', 'vieja']);
  });

  it('devuelve lista vacía cuando el target no tiene reseñas', async () => {
    const { useCase } = build();
    const result = await useCase.execute({ localId: 'inexistente' });
    expect(result).toEqual([]);
  });
});
