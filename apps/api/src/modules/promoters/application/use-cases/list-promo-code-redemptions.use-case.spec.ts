import { describe, expect, it } from 'vitest';
import { TenantForbiddenError } from '../../../../shared/errors/tenant-forbidden.error';
import { InMemoryPromoCodeRepository } from '../../../../shared/testing/in-memory/promoters';
import { SUPER_ADMIN_SCOPE, scopeForCompany } from '../../../../shared/testing/fakes';
import { ListPromoCodeRedemptionsUseCase } from './list-promo-code-redemptions.use-case';

/** Repo in-memory que además resuelve el companyId dueño (barrera tenant M5). */
class TenantAwarePromoCodes extends InMemoryPromoCodeRepository {
  constructor(private readonly owner: string | null) {
    super();
  }
  async ownerCompanyId(): Promise<string | null> {
    return this.owner;
  }
}

async function seedRedemption(repo: InMemoryPromoCodeRepository, promoCodeId = 'pc1') {
  await repo.recordRedemption({
    id: 'r1',
    promoCodeId,
    orderId: 'o1',
    userId: 'u1',
    discountApplied: 10,
    redeemedAt: new Date(),
  });
}

describe('ListPromoCodeRedemptionsUseCase (M5 aislamiento tenant)', () => {
  it('super_admin lee canjes de cualquier código', async () => {
    const repo = new InMemoryPromoCodeRepository();
    await seedRedemption(repo);
    const useCase = new ListPromoCodeRedemptionsUseCase(repo);

    const rows = await useCase.execute({ promoCodeId: 'pc1', scope: SUPER_ADMIN_SCOPE });

    expect(rows).toHaveLength(1);
  });

  it('admin_local lee canjes de un código de SU empresa', async () => {
    const repo = new TenantAwarePromoCodes('c1');
    await seedRedemption(repo);
    const useCase = new ListPromoCodeRedemptionsUseCase(repo);

    const rows = await useCase.execute({ promoCodeId: 'pc1', scope: scopeForCompany('c1') });

    expect(rows).toHaveLength(1);
  });

  it('admin_local NO puede leer canjes de otra empresa → TenantForbiddenError (IDOR)', async () => {
    const repo = new TenantAwarePromoCodes('c1');
    await seedRedemption(repo);
    const useCase = new ListPromoCodeRedemptionsUseCase(repo);

    await expect(
      useCase.execute({ promoCodeId: 'pc1', scope: scopeForCompany('otra') }),
    ).rejects.toBeInstanceOf(TenantForbiddenError);
  });

  it('falla CERRADO: si el adapter no resuelve propiedad, deniega a admin_local', async () => {
    const repo = new InMemoryPromoCodeRepository(); // sin ownerCompanyId
    await seedRedemption(repo);
    const useCase = new ListPromoCodeRedemptionsUseCase(repo);

    await expect(
      useCase.execute({ promoCodeId: 'pc1', scope: scopeForCompany('c1') }),
    ).rejects.toBeInstanceOf(TenantForbiddenError);
  });
});
