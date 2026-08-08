import { describe, expect, it } from 'vitest';
import { FakeResourceTenant, SUPER_ADMIN_SCOPE } from '../../../../shared/testing/fakes';
import { InMemoryLocalPolicyRepository } from '../../../../shared/testing/in-memory/menu';
import { MenuDepositPercentInvalidError } from '../../domain/errors/menu.errors';
import { GetLocalPolicyUseCase } from './get-local-policy.use-case';
import { UpdateLocalPolicyUseCase } from './update-local-policy.use-case';

const LOCAL_ID = '11111111-1111-1111-1111-111111111111';

function build() {
  const policies = new InMemoryLocalPolicyRepository();
  const tenant = new FakeResourceTenant('company-a');
  return {
    policies,
    get: new GetLocalPolicyUseCase(policies, tenant),
    update: new UpdateLocalPolicyUseCase(policies, tenant),
  };
}

describe('casos de uso de política del local', () => {
  it('crea la política predeterminada al leer un local sin configuración', async () => {
    const { get, policies } = build();

    const result = await get.execute({ localId: LOCAL_ID, scope: SUPER_ADMIN_SCOPE });

    expect(result.reservationDepositPercent).toBe(0);
    expect(result.birthdayWindowDays).toBe(1);
    expect(policies.size).toBe(1);
  });

  it('edita la política del local', async () => {
    const { update } = build();

    const result = await update.execute({
      localId: LOCAL_ID,
      dto: { reservationDepositPercent: 25, birthdayWindowDays: 2 },
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(result.reservationDepositPercent).toBe(25);
    expect(result.birthdayWindowDays).toBe(2);
  });

  it('porcentaje de depósito no múltiplo de 5 produce error de dominio', async () => {
    const { update } = build();

    await expect(
      update.execute({
        localId: LOCAL_ID,
        dto: { reservationDepositPercent: 12, birthdayWindowDays: 1 },
        scope: SUPER_ADMIN_SCOPE,
      }),
    ).rejects.toBeInstanceOf(MenuDepositPercentInvalidError);
  });
});
