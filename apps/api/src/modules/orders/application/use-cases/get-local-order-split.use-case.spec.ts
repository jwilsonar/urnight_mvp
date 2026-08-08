import { describe, expect, it } from 'vitest';
import { InMemoryLocalOrderSplitRepository } from '../../../../shared/testing/in-memory/orders';
import { LocalOrderSplit } from '../../domain/entities/local-order-split.entity';
import { GetLocalOrderSplitUseCase } from './get-local-order-split.use-case';

describe('GetLocalOrderSplitUseCase', () => {
  it('consulta el split por el token compartible', async () => {
    const splits = new InMemoryLocalOrderSplitRepository();
    splits.seed(
      LocalOrderSplit.create({
        id: '11111111-1111-1111-1111-111111111111',
        orderId: '22222222-2222-2222-2222-222222222222',
        shareToken: 'token-publico',
        expectedTotal: 70,
        createdAt: new Date('2026-08-04T06:00:00.000Z'),
        updatedAt: new Date('2026-08-04T06:00:00.000Z'),
      }),
    );
    const useCase = new GetLocalOrderSplitUseCase(splits);

    const split = await useCase.execute('token-publico');

    expect(split.orderId).toBe('22222222-2222-2222-2222-222222222222');
  });
});
