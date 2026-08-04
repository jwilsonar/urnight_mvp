"use client";

import {
  ChartBar,
  FunnelSimple,
  UsersThree,
  WarningDiamond,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type {
  PromoterRankingQuery,
  PromoterRankingRowResponse,
} from "@urnight/contracts";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@urnight/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { listPromoterRanking } from "@/lib/api/promoters";
import { queryKeys } from "@/lib/api/query-keys";
import { isUuid } from "@/lib/utils";

interface RankingFilters {
  eventId: string;
  from: string;
  to: string;
  sortBy: PromoterRankingQuery["sortBy"];
  order: PromoterRankingQuery["order"];
}

const EMPTY_FILTERS: RankingFilters = {
  eventId: "",
  from: "",
  to: "",
  sortBy: "sales",
  order: "desc",
};

function toQuery(filters: RankingFilters): PromoterRankingQuery {
  return {
    eventId: filters.eventId || undefined,
    from: filters.from
      ? new Date(`${filters.from}T00:00:00.000Z`).toISOString()
      : undefined,
    to: filters.to
      ? new Date(`${filters.to}T23:59:59.999Z`).toISOString()
      : undefined,
    sortBy: filters.sortBy,
    order: filters.order,
  };
}

function moneySummary(
  locale: string,
  row: PromoterRankingRowResponse,
  field: "grossAmount" | "commissionAmount",
): string {
  if (row.totals.salesByCurrency.length === 0) return "—";
  return row.totals.salesByCurrency
    .map((money) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: money.currency,
      }).format(money[field]),
    )
    .join(" · ");
}

function formatMoney(locale: string, currency: string, amount: number): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    amount,
  );
}

/**
 * K2: ranking server-side tenant-scoped. El porcentaje mantiene siempre visible
 * su numerador/denominador y no compite hasta alcanzar el volumen mínimo.
 */
export function PromoterRanking() {
  const locale = useLocale();
  const t = useTranslations("promoterMetrics.ranking");
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const [draft, setDraft] = useState<RankingFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<RankingFilters>(EMPTY_FILTERS);
  const [eventError, setEventError] = useState<string | null>(null);
  const queryInput = useMemo(() => toQuery(applied), [applied]);
  const rankingQuery = useQuery({
    queryKey: queryKeys.promoterRanking(queryInput),
    queryFn: () => listPromoterRanking(queryInput, token),
    enabled: status === "authenticated" && Boolean(token),
  });

  const apply = () => {
    if (draft.eventId && !isUuid(draft.eventId)) {
      setEventError(t("invalidEvent"));
      return;
    }
    if (draft.from && draft.to && draft.from > draft.to) {
      setEventError(t("invalidRange"));
      return;
    }
    setEventError(null);
    setApplied(draft);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-accent-border bg-accent text-rose">
            <ChartBar className="size-5" weight="duotone" />
          </span>
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="min-w-0 space-y-1.5 md:col-span-2">
            <Label htmlFor="ranking-event">{t("eventFilter")}</Label>
            <Input
              id="ranking-event"
              value={draft.eventId}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  eventId: event.target.value.trim(),
                }))
              }
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              aria-invalid={Boolean(eventError)}
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="ranking-from">{t("from")}</Label>
            <Input
              id="ranking-from"
              type="date"
              value={draft.from}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  from: event.target.value,
                }))
              }
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="ranking-to">{t("to")}</Label>
            <Input
              id="ranking-to"
              type="date"
              value={draft.to}
              onChange={(event) =>
                setDraft((current) => ({ ...current, to: event.target.value }))
              }
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="ranking-sort">{t("sortBy")}</Label>
            <Select
              value={draft.sortBy}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  sortBy: value as RankingFilters["sortBy"],
                }))
              }
            >
              <SelectTrigger id="ranking-sort" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">{t("sales")}</SelectItem>
                <SelectItem value="attendance">{t("attendance")}</SelectItem>
                <SelectItem value="attendance_rate">
                  {t("attendanceRate")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="ranking-order">{t("order")}</Label>
            <Select
              value={draft.order}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  order: value as RankingFilters["order"],
                }))
              }
            >
              <SelectTrigger id="ranking-order" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">{t("descending")}</SelectItem>
                <SelectItem value="asc">{t("ascending")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 md:flex md:justify-end xl:col-span-6">
            <Button
              type="button"
              onClick={apply}
              className="w-full md:w-auto"
            >
              <FunnelSimple className="size-4" weight="bold" />
              {t("apply")}
            </Button>
          </div>
        </div>
        {eventError ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {eventError}
          </p>
        ) : null}

        {rankingQuery.isError ? (
          <ErrorState
            title={t("errorTitle")}
            description={t("errorDescription")}
            onRetry={() => void rankingQuery.refetch()}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {t.rich("minimumVolume", {
                  count: rankingQuery.data?.minimumVolume ?? 10,
                  strong: (chunks) => (
                    <strong className="text-foreground">{chunks}</strong>
                  ),
                })}
              </p>
              <Badge variant="secondary">{t("rules")}</Badge>
            </div>
            {rankingQuery.data && rankingQuery.data.conflicts.length > 0 ? (
              <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/5 p-4">
                <div className="flex items-start gap-3">
                  <WarningDiamond
                    className="mt-0.5 size-5 shrink-0 text-warning"
                    weight="duotone"
                  />
                  <div>
                    <p className="font-semibold">{t("conflictsTitle")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("conflictsDescription", {
                        count: rankingQuery.data.conflictingOrdersExcluded,
                      })}
                    </p>
                  </div>
                </div>
                {rankingQuery.data.conflicts.map((conflict) => (
                  <div
                    key={conflict.orderId}
                    className="rounded-md border bg-background/70 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-semibold">
                        {conflict.orderId}
                      </span>
                      <span className="font-semibold">
                        {formatMoney(
                          locale,
                          conflict.currency,
                          conflict.amount,
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {conflict.eventName}
                    </p>
                    <p className="mt-1 break-all text-xs text-warning">
                      {t("promotersInConflict", {
                        promoters: conflict.promoterIds.join(", "),
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t("position")}</TableHead>
                    <TableHead>{t("promoter")}</TableHead>
                    <TableHead>{t("attributedSales")}</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead>{t("realAttendance")}</TableHead>
                    <TableHead>{t("attendanceRate")}</TableHead>
                    <TableHead>{t("estimatedCommission")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingQuery.isPending ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 7 }).map((__, cell) => (
                          <TableCell key={cell}>
                            <Skeleton className="h-5 w-full min-w-16" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : rankingQuery.data.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <EmptyState
                          compact
                          icon={<UsersThree weight="duotone" />}
                          title={t("emptyTitle")}
                          description={t("emptyDescription")}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    rankingQuery.data.rows.map((row, index) => (
                      <TableRow key={row.promoterId}>
                        <TableCell className="font-heading text-lg font-bold">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold">{row.promoterName}</p>
                          {row.totals.conflictingOrdersExcluded > 0 ? (
                            <p className="text-xs text-warning">
                              {t("ambiguousOrders", {
                                count: row.totals.conflictingOrdersExcluded,
                              })}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-semibold tabular-nums">
                          {row.totals.salesCount}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {moneySummary(locale, row, "grossAmount")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          <p className="font-semibold">
                            {t("funnelInvited", {
                              count: row.totals.invitedCount,
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("funnelRedeemed", {
                              count: row.totals.redeemedCount,
                              rate: row.totals.redemptionRate,
                            })}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold tabular-nums">
                              {t("funnelAttended", {
                                count: row.totals.attendedCount,
                                rate: row.totals.attendanceRate,
                              })}
                            </p>
                            <Badge
                              variant={
                                row.eligibleForRateRanking
                                  ? "success"
                                  : "secondary"
                              }
                            >
                              {row.eligibleForRateRanking
                                ? t("eligible")
                                : t("lowVolume")}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <p>{moneySummary(locale, row, "commissionAmount")}</p>
                          {row.totals.commissionPendingCount > 0 ? (
                            <p className="text-xs text-warning">
                              {t("commissionPending", {
                                count: row.totals.commissionPendingCount,
                              })}
                            </p>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
