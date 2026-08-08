import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import {
  localOrderWindow,
  menuCategory,
  menuProduct,
  menuProductPrice,
} from '@urnight/db';
import {
  DRIZZLE,
  type DrizzleDb,
} from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import type {
  OrderableProduct,
  OrdersCatalogPort,
  OrderWindow,
} from '../../domain/ports/orders-catalog.port';

@Injectable()
export class DrizzleOrdersCatalogAdapter implements OrdersCatalogPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findProduct(productId: string, tx?: unknown): Promise<OrderableProduct | null> {
    const [row] = await this.exec(tx)
      .select({
        id: menuProduct.id,
        localId: menuCategory.localId,
        isAvailable: menuProduct.isAvailable,
        amount: menuProductPrice.amount,
        currency: menuProductPrice.currency,
      })
      .from(menuProduct)
      .innerJoin(menuCategory, eq(menuCategory.id, menuProduct.categoryId))
      .innerJoin(
        menuProductPrice,
        and(
          eq(menuProductPrice.productId, menuProduct.id),
          isNull(menuProductPrice.validTo),
        ),
      )
      .where(eq(menuProduct.id, productId))
      .limit(1);
    return row ? { ...row, amount: Number(row.amount) } : null;
  }

  async listOrderWindows(localId: string, tx?: unknown): Promise<OrderWindow[]> {
    return this.exec(tx)
      .select({
        localId: localOrderWindow.localId,
        dayOfWeek: localOrderWindow.dayOfWeek,
        startsAt: localOrderWindow.startsAt,
        endsAt: localOrderWindow.endsAt,
      })
      .from(localOrderWindow)
      .where(eq(localOrderWindow.localId, localId));
  }

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }
}
