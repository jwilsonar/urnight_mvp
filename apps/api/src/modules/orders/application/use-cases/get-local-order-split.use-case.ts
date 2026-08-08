import { Inject, Injectable } from '@nestjs/common';
import type { LocalOrderSplit } from '../../domain/entities/local-order-split.entity';
import { LocalOrderSplitNotFoundError } from '../../domain/errors/orders.errors';
import {
  LOCAL_ORDER_SPLIT_REPOSITORY,
  type LocalOrderSplitRepository,
} from '../../domain/ports/local-order-split.repository';

@Injectable()
export class GetLocalOrderSplitUseCase {
  constructor(
    @Inject(LOCAL_ORDER_SPLIT_REPOSITORY)
    private readonly splits: LocalOrderSplitRepository,
  ) {}

  async execute(shareToken: string): Promise<LocalOrderSplit> {
    const split = await this.splits.findByToken(shareToken);
    if (!split) throw new LocalOrderSplitNotFoundError();
    return split;
  }
}
