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
  ownSales: PromoterRankingSales;
  teamMemberCount?: number;
  teamSales?: PromoterRankingSales;
}

export interface PromoterRankingSales {
  salesCount: number;
  salesByCurrency: PromoterMetricTotals["salesByCurrency"];
}

function ownSales(totals: PromoterMetricTotals): PromoterRankingSales {
  return {
    salesCount: totals.salesCount,
    salesByCurrency: totals.salesByCurrency,
  };
}

function aggregateTeamSales(
  rows: PromoterMetricTotals[],
): PromoterRankingSales {
  const money = new Map<
    string,
    { grossAmount: number; commissionAmount: number }
  >();
  for (const totals of rows) {
    for (const amounts of totals.salesByCurrency) {
      const current = money.get(amounts.currency) ?? {
        grossAmount: 0,
        commissionAmount: 0,
      };
      current.grossAmount += amounts.grossAmount;
      current.commissionAmount += amounts.commissionAmount;
      money.set(amounts.currency, current);
    }
  }
  return {
    salesCount: rows.reduce((sum, totals) => sum + totals.salesCount, 0),
    salesByCurrency: [...money.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([currency, amounts]) => ({
        currency,
        grossAmount: Math.round(amounts.grossAmount * 100) / 100,
        commissionAmount: Math.round(amounts.commissionAmount * 100) / 100,
      })),
  };
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
    const activePromoters = promoters.filter((promoter) => promoter.isActive());
    const metricsByPromoter = new Map(
      activePromoters.map((promoter) => {
        const metrics = calculatePromoterMetrics(
          promoterIdentity(promoter),
          facts,
        );
        for (const conflict of metrics.conflicts) {
          conflicts.set(conflict.orderId, conflict);
        }
        return [promoter.id, metrics] as const;
      }),
    );
    const rows = activePromoters.map((promoter): PromoterRankingRow => {
      const metrics = metricsByPromoter.get(promoter.id)!;
      const children = activePromoters.filter(
        (candidate) =>
          candidate.parentPromoterId === promoter.id &&
          candidate.companyId === promoter.companyId,
      );
      return {
        promoterId: metrics.promoterId,
        promoterName: metrics.promoterName,
        companyId: metrics.companyId,
        eligibleForRateRanking:
          metrics.totals.invitedCount >= ATTENDANCE_RATE_MINIMUM_VOLUME,
        totals: metrics.totals,
        ownSales: ownSales(metrics.totals),
        ...(children.length > 0
          ? {
              teamMemberCount: children.length,
              teamSales: aggregateTeamSales(
                children.map(
                  (child) => metricsByPromoter.get(child.id)!.totals,
                ),
              ),
            }
          : {}),
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
