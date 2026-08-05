import { describe, expect, it } from "vitest";
import { TenantForbiddenError } from "../../../../shared/errors/tenant-forbidden.error";
import { FakePromoterCascadePolicyRepository } from "../../testing/fake-promoter-cascade-policy.repository";
import {
  GetPromoterCascadePolicyUseCase,
  UpdatePromoterCascadePolicyUseCase,
} from "./promoter-cascade-policy.use-case";

function build() {
  const policies = new FakePromoterCascadePolicyRepository().seedLocal(
    "local-1",
    "company-1",
  );
  return {
    getPolicy: new GetPromoterCascadePolicyUseCase(policies),
    updatePolicy: new UpdatePromoterCascadePolicyUseCase(policies),
  };
}

describe("politica local de cascada", () => {
  it("sin configuracion persistida responde apagada y en cero", async () => {
    const { getPolicy } = build();

    const result = await getPolicy.execute({
      localId: "local-1",
      scope: { isSuperAdmin: false, companyId: "company-1" },
    });

    expect(result).toEqual({
      localId: "local-1",
      cascadeEnabled: false,
      cascadePercentage: 0,
    });
  });

  it("persiste una politica opt-in por local", async () => {
    const { getPolicy, updatePolicy } = build();

    await updatePolicy.execute({
      localId: "local-1",
      cascadeEnabled: true,
      cascadePercentage: 10,
      scope: { isSuperAdmin: false, companyId: "company-1" },
    });

    await expect(
      getPolicy.execute({
        localId: "local-1",
        scope: { isSuperAdmin: false, companyId: "company-1" },
      }),
    ).resolves.toMatchObject({ cascadeEnabled: true, cascadePercentage: 10 });
  });

  it("impide configurar un local de otra empresa", async () => {
    const { updatePolicy } = build();

    await expect(
      updatePolicy.execute({
        localId: "local-1",
        cascadeEnabled: true,
        cascadePercentage: 10,
        scope: { isSuperAdmin: false, companyId: "company-2" },
      }),
    ).rejects.toBeInstanceOf(TenantForbiddenError);
  });
});
