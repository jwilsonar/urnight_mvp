import { Inject, Injectable } from "@nestjs/common";
import {
  scopedCompanyId,
  type TenantScope,
} from "../../../../shared/tenant/tenant-scope";
import {
  PROMOTER_ANALYTICS_REPOSITORY,
  type PromoterAnalyticsRepository,
} from "../../domain/ports/promoter-analytics.repository";
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from "../../domain/ports/promoter.repository";
import type { PromoterMetricsFilter } from "./get-promoter-metrics.use-case";
import {
  calculatePromoterMetrics,
  promoterIdentity,
  type PromoterAttributionConflict,
  type PromoterMetricTotals,
} from "./promoter-metrics.calculator";

export const ATTENDANCE_RATE_MINIMUM_VOLUME = 10;

export type PromoterRankingSort = "sales" | "attendance" | "attendance_rate";
export type PromoterRankingOrder = "asc" | "desc";

export interface PromoterRankingRow {
  promoterId: string;
  promoterName: string;
  companyId: string;
  eligibleForRateRanking: boolean;
  totals: PromoterMetricTotals;
}

export interface PromoterRanking {
  minimumVolume: number;
  conflictingOrdersExcluded: number;
  conflicts: PromoterAttributionConflict[];
  rows: PromoterRankingRow[];
}

function rankingValue(
  row: PromoterRankingRow,
  sortBy: PromoterRankingSort,
): number {
  switch (sortBy) {
    case "attendance":
      return row.totals.attendedCount;
    case "attendance_rate":
      return row.totals.attendanceRate;
    default:
      return row.totals.salesCount;
  }
}

@Injectable()
export class ListPromoterRankingUseCase {
  constructor(
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(PROMOTER_ANALYTICS_REPOSITORY)
    private readonly analytics: PromoterAnalyticsRepository,
  ) {}

  async execute(input: {
    scope: TenantScope;
    filter: PromoterMetricsFilter;
    sortBy: PromoterRankingSort;
    order: PromoterRankingOrder;
  }): Promise<PromoterRanking> {
    const companyId = scopedCompanyId(input.scope);
    if (companyId === undefined) {
      return {
        minimumVolume: ATTENDANCE_RATE_MINIMUM_VOLUME,
        conflictingOrdersExcluded: 0,
        conflicts: [],
        rows: [],
      };
    }

    const [promoters, facts] = await Promise.all([
      this.promoters.listByCompany(companyId),
      this.analytics.listFacts({ companyId, ...input.filter }),
    ]);
    const conflicts = new Map<string, PromoterAttributionConflict>();
    const rows = promoters
      .filter((promoter) => promoter.isActive())
      .map((promoter): PromoterRankingRow => {
        const metrics = calculatePromoterMetrics(
          promoterIdentity(promoter),
          facts,
        );
        for (const conflict of metrics.conflicts) {
          conflicts.set(conflict.orderId, conflict);
        }
        return {
          promoterId: metrics.promoterId,
          promoterName: metrics.promoterName,
          companyId: metrics.companyId,
          eligibleForRateRanking:
            metrics.totals.invitedCount >= ATTENDANCE_RATE_MINIMUM_VOLUME,
          totals: metrics.totals,
        };
      });

    rows.sort((a, b) => {
      if (input.sortBy === "attendance_rate") {
        const eligibility =
          Number(b.eligibleForRateRanking) - Number(a.eligibleForRateRanking);
        if (eligibility !== 0) return eligibility;
      }
      const direction = input.order === "asc" ? 1 : -1;
      return (
        (rankingValue(a, input.sortBy) - rankingValue(b, input.sortBy)) *
          direction ||
        b.totals.invitedCount - a.totals.invitedCount ||
        a.promoterName.localeCompare(b.promoterName)
      );
    });

    return {
      minimumVolume: ATTENDANCE_RATE_MINIMUM_VOLUME,
      conflictingOrdersExcluded: conflicts.size,
      conflicts: [...conflicts.values()],
      rows,
    };
  }
}
