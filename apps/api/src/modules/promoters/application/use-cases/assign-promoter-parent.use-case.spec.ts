import { describe, expect, it } from "vitest";
import { PromoterBuilder } from "../../../../shared/testing/builders/promoters";
import { InMemoryPromoterRepository } from "../../../../shared/testing/in-memory/promoters";
import {
  PromoterHierarchyCompanyMismatchError,
  PromoterHierarchyCycleError,
  PromoterHierarchyDepthExceededError,
} from "../../domain/errors/promoters.errors";
import { AssignPromoterParentUseCase } from "./assign-promoter-parent.use-case";

const scope = { isSuperAdmin: true, companyId: null } as const;

function build() {
  const promoters = new InMemoryPromoterRepository();
  return {
    promoters,
    useCase: new AssignPromoterParentUseCase(promoters),
  };
}

describe("AssignPromoterParentUseCase", () => {
  it("rechaza un padre de otra empresa con un error de dominio explicito", async () => {
    const { promoters, useCase } = build();
    promoters.seed(
      new PromoterBuilder().withId("child").withCompanyId("company-1").build(),
    );
    promoters.seed(
      new PromoterBuilder().withId("head").withCompanyId("company-2").build(),
    );

    await expect(
      useCase.execute({ promoterId: "child", parentPromoterId: "head", scope }),
    ).rejects.toBeInstanceOf(PromoterHierarchyCompanyMismatchError);
  });

  it("rechaza el ciclo directo de un promotor consigo mismo", async () => {
    const { promoters, useCase } = build();
    promoters.seed(
      new PromoterBuilder().withId("same").withCompanyId("company-1").build(),
    );

    await expect(
      useCase.execute({ promoterId: "same", parentPromoterId: "same", scope }),
    ).rejects.toBeInstanceOf(PromoterHierarchyCycleError);
  });

  it("rechaza un ciclo indirecto antes de tratarlo como exceso de profundidad", async () => {
    const { promoters, useCase } = build();
    promoters.seed(
      new PromoterBuilder().withId("head").withCompanyId("company-1").build(),
    );
    const child = new PromoterBuilder()
      .withId("child")
      .withCompanyId("company-1")
      .build();
    child.assignParent("head");
    promoters.seed(child);

    await expect(
      useCase.execute({ promoterId: "head", parentPromoterId: "child", scope }),
    ).rejects.toBeInstanceOf(PromoterHierarchyCycleError);
  });

  it("rechaza crear tres niveles cuando el padre propuesto ya depende de un cabeza", async () => {
    const { promoters, useCase } = build();
    promoters.seed(
      new PromoterBuilder().withId("head").withCompanyId("company-1").build(),
    );
    const middle = new PromoterBuilder()
      .withId("middle")
      .withCompanyId("company-1")
      .build();
    middle.assignParent("head");
    promoters.seed(middle);
    promoters.seed(
      new PromoterBuilder().withId("leaf").withCompanyId("company-1").build(),
    );

    await expect(
      useCase.execute({
        promoterId: "leaf",
        parentPromoterId: "middle",
        scope,
      }),
    ).rejects.toBeInstanceOf(PromoterHierarchyDepthExceededError);
  });
});
