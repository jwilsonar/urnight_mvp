import type { LocalOrderWindow } from '../entities/local-order-window.entity';
import type { LocalPolicy } from '../entities/local-policy.entity';

export interface LocalPolicyRepository {
  findPolicy(localId: string): Promise<LocalPolicy | null>;
  createPolicyIfMissing(policy: LocalPolicy): Promise<LocalPolicy>;
  upsertPolicy(policy: LocalPolicy): Promise<LocalPolicy>;
  listOrderWindows(localId: string): Promise<LocalOrderWindow[]>;
  replaceOrderWindows(
    localId: string,
    windows: LocalOrderWindow[],
    tx?: unknown,
  ): Promise<LocalOrderWindow[]>;
}

export const LOCAL_POLICY_REPOSITORY = Symbol('LOCAL_POLICY_REPOSITORY');
