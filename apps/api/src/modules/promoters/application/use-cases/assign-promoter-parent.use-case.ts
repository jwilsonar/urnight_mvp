import { Inject, Injectable } from "@nestjs/common";
import {
  assertTenant,
  type TenantScope,
} from "../../../../shared/tenant/tenant-scope";
import type { Promoter } from "../../domain/entities/promoter.entity";
import {
  PromoterHierarchyCompanyMismatchError,
  PromoterHierarchyCycleError,
  PromoterHierarchyDepthExceededError,
  PromoterNotFoundError,
} from "../../domain/errors/promoters.errors";
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from "../../domain/ports/promoter.repository";

@Injectable()
export class AssignPromoterParentUseCase {
  constructor(
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
  ) {}

  async execute(input: {
    promoterId: string;
    parentPromoterId: string | null;
    scope: TenantScope;
  }): Promise<Promoter> {
    const child = await this.promoters.findById(input.promoterId);
    if (!child) throw new PromoterNotFoundError();
    assertTenant(input.scope, child.companyId);

    if (input.parentPromoterId === null) {
      child.assignParent(null);
      await this.promoters.update(child);
      return child;
    }
    if (input.parentPromoterId === child.id) {
      throw new PromoterHierarchyCycleError();
    }

    const parent = await this.promoters.findById(input.parentPromoterId);
    if (!parent) throw new PromoterNotFoundError();
    this.assertSameCompany(child.companyId, parent.companyId);
    await this.assertNoCycle(child.id, parent);

    const companyPromoters = await this.promoters.listByCompany(child.companyId);
    if (
      parent.parentPromoterId ||
      companyPromoters.some((candidate) => candidate.parentPromoterId === child.id)
    ) {
      throw new PromoterHierarchyDepthExceededError();
    }

    child.assignParent(parent.id);
    await this.promoters.update(child);
    return child;
  }

  private assertSameCompany(
    childCompanyId: string,
    parentCompanyId: string,
  ): void {
    try {
      assertTenant(
        { isSuperAdmin: false, companyId: childCompanyId },
        parentCompanyId,
      );
    } catch {
      throw new PromoterHierarchyCompanyMismatchError();
    }
  }

  private async assertNoCycle(
    childId: string,
    proposedParent: Promoter,
  ): Promise<void> {
    const visited = new Set<string>();
    let current: Promoter | null = proposedParent;
    while (current) {
      if (current.id === childId || visited.has(current.id)) {
        throw new PromoterHierarchyCycleError();
      }
      visited.add(current.id);
      current = current.parentPromoterId
        ? await this.promoters.findById(current.parentPromoterId)
        : null;
    }
  }
}
