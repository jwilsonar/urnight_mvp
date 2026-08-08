import { describe, expect, it } from 'vitest';
import {
  FakeResourceTenant,
  SUPER_ADMIN_SCOPE,
  fakeUnitOfWork,
} from '../../../../shared/testing/fakes';
import { InMemoryLocalPolicyRepository } from '../../../../shared/testing/in-memory/menu';
import { MenuOrderWindowInvalidError } from '../../domain/errors/menu.errors';
import { GetLocalOrderWindowsUseCase } from './get-local-order-windows.use-case';
import { ReplaceLocalOrderWindowsUseCase } from './replace-local-order-windows.use-case';

const LOCAL_ID = '11111111-1111-1111-1111-111111111111';

function build() {
  const policies = new InMemoryLocalPolicyRepository();
  const tenant = new FakeResourceTenant('company-a');
  return {
    get: new GetLocalOrderWindowsUseCase(policies, tenant),
    replace: new ReplaceLocalOrderWindowsUseCase(
      policies,
      tenant,
      fakeUnitOfWork(),
    ),
  };
}

describe('casos de uso de horario de pedidos', () => {
  it('lee las ventanas configuradas del local', async () => {
    const { get } = build();

    const result = await get.execute({ localId: LOCAL_ID, scope: SUPER_ADMIN_SCOPE });

    expect(result).toEqual([]);
  });

  it('acepta una ventana que cruza medianoche', async () => {
    const { replace } = build();

    const result = await replace.execute({
      localId: LOCAL_ID,
      dto: { windows: [{ dayOfWeek: 5, startsAt: '22:00', endsAt: '03:00' }] },
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.startsAt).toBe('22:00');
    expect(result[0]?.endsAt).toBe('03:00');
  });

  it('rechaza una ventana sin duración', async () => {
    const { replace } = build();

    await expect(
      replace.execute({
        localId: LOCAL_ID,
        dto: { windows: [{ dayOfWeek: 5, startsAt: '22:00', endsAt: '22:00' }] },
        scope: SUPER_ADMIN_SCOPE,
      }),
    ).rejects.toBeInstanceOf(MenuOrderWindowInvalidError);
  });
});
