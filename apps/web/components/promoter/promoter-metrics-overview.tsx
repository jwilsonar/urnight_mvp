"use client";

import {
  ChartBar,
  Clock,
  Money,
  UserCheck,
  UsersThree,
  WarningDiamond,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { PROMOTER_ANALYTICS_TIME_ZONE } from "@urnight/contracts";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { StatCard } from "@/components/shared/stat-card";
import { getMyPromoterMetrics } from "@/lib/api/promoters";
import { queryKeys } from "@/lib/api/query-keys";

function formatMoney(locale: string, currency: string, amount: number): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    amount,
  );
}

function moneySummary(
  locale: string,
  rows: { currency: string; grossAmount: number; commissionAmount: number }[],
  field: "grossAmount" | "commissionAmount",
): string {
  if (rows.length === 0) return formatMoney(locale, "PEN", 0);
  return rows
    .map((row) => formatMoney(locale, row.currency, row[field]))
    .join(" · ");
}

/**
 * K3: resumen real del promotor autenticado. Consume `/promoters/me/metrics`,
 * endpoint que no acepta un promoterId controlado por el navegador.
 */
export function PromoterMetricsOverview() {
  const locale = useLocale();
  const t = useTranslations("promoterMetrics.overview");
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const query = useQuery({
    queryKey: queryKeys.promoterMetricsMe(),
    queryFn: () => getMyPromoterMetrics({}, token),
    enabled: status === "authenticated" && Boolean(token),
  });

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title={t("errorTitle")}
        description={t("errorDescription")}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const metrics = query.data;
  const totals = metrics.totals;
  const companionCoverage =
    totals.companionOrdersKnown + totals.companionOrdersUnknown;
  const formatDateTime = (value: string): string =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: PROMOTER_ANALYTICS_TIME_ZONE,
    }).format(new Date(value));
  const formatDateOnly = (value: string): string =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeZone: PROMOTER_ANALYTICS_TIME_ZONE,
    }).format(new Date(value));
  const entryRange = (first: string | null, last: string | null): string =>
    !first || !last
      ? t("noEntries")
      : t("entryRange", {
          first: formatDateTime(first),
          last: formatDateTime(last),
        });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={t("peopleOnList")}
          value={totals.invitedCount}
          hint={t("allocatedInvites", { count: totals.allocatedCount })}
          icon={<UsersThree weight="duotone" />}
        />
        <StatCard
          label={t("redeemedInvites")}
          value={`${totals.redeemedCount} · ${totals.redemptionRate}%`}
          hint={t("redemptionRateHint")}
          tone="accent"
          icon={<ChartBar weight="duotone" />}
        />
        <StatCard
          label={t("realAttendance")}
          value={`${totals.attendedCount} · ${totals.attendanceRate}%`}
          hint={t("uniqueDoorValidations")}
          tone="success"
          icon={<UserCheck weight="duotone" />}
        />
        <StatCard
          label={t("attributedSales")}
          value={totals.salesCount}
          hint={moneySummary(locale, totals.salesByCurrency, "grossAmount")}
          tone="accent"
          icon={<ChartBar weight="duotone" />}
        />
        <StatCard
          label={t("estimatedCommission")}
          value={moneySummary(
            locale,
            totals.salesByCurrency,
            "commissionAmount",
          )}
          hint={
            totals.commissionPendingCount > 0
              ? t("commissionPending", {
                  count: totals.commissionPendingCount,
                })
              : t("paidOrdersOnly")
          }
          tone="warning"
          icon={<Money weight="duotone" />}
        />
      </div>

      {metrics.conflicts.length > 0 ? (
        <Card className="border-warning/40">
          <CardHeader>
            <div className="flex items-start gap-3">
              <WarningDiamond
                className="mt-0.5 size-5 shrink-0 text-warning"
                weight="duotone"
              />
              <div>
                <CardTitle className="text-base">
                  {t("conflictsTitle")}
                </CardTitle>
                <CardDescription>{t("conflictsDescription")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.conflicts.map((conflict) => (
              <div
                key={conflict.orderId}
                className="rounded-lg border bg-muted/20 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-semibold">
                    {conflict.orderId}
                  </span>
                  <span className="font-semibold">
                    {formatMoney(locale, conflict.currency, conflict.amount)}
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
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("arrivalTitle")}</CardTitle>
          <CardDescription>
            {entryRange(totals.firstEntryAt, totals.lastEntryAt)}
            {totals.peakEntryHourAt
              ? ` · ${t("peakHour", {
                  date: formatDateTime(totals.peakEntryHourAt),
                })}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="rv-eyebrow !text-muted-foreground">
              {t("identifiedCompanions")}
            </p>
            <p className="mt-1 font-heading text-3xl font-extrabold">
              {totals.companionsCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {companionCoverage === 0
                ? t("noAttendeeOrders")
                : t("knownOrders", { count: totals.companionOrdersKnown })}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="rv-eyebrow !text-muted-foreground">
              {t("dataCoverage")}
            </p>
            <p className="mt-1 font-heading text-3xl font-extrabold">
              {totals.companionOrdersUnknown}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("unknownCoverage")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">{t("eventsTitle")}</CardTitle>
          <CardDescription>{t("eventsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {metrics.events.length === 0 ? (
            <EmptyState
              compact
              icon={<Clock weight="duotone" />}
              title={t("emptyTitle")}
              description={t("emptyDescription")}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("event")}</TableHead>
                    <TableHead>{t("attendance")}</TableHead>
                    <TableHead>{t("entry")}</TableHead>
                    <TableHead>{t("companions")}</TableHead>
                    <TableHead>{t("sales")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.events.map((event) => (
                    <TableRow key={event.eventId} className="align-top">
                      <TableCell className="min-w-52">
                        <p className="font-semibold">{event.eventName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateOnly(event.eventStartsAt)}
                        </p>
                        {event.excludedReason ? (
                          <Badge variant="destructive" className="mt-2">
                            {t("cancelledExcluded")}
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="min-w-44 whitespace-nowrap tabular-nums">
                        <p className="font-semibold">
                          {t("funnelInvited", { count: event.invitedCount })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("funnelRedeemed", {
                            count: event.redeemedCount,
                            rate: event.redemptionRate,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("funnelAttended", {
                            count: event.attendedCount,
                            rate: event.attendanceRate,
                          })}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-64 text-xs text-muted-foreground">
                        <p>
                          {entryRange(event.firstEntryAt, event.lastEntryAt)}
                        </p>
                        {event.peakEntryHourAt ? (
                          <p className="mt-1 text-foreground">
                            {t("peak", {
                              date: formatDateTime(event.peakEntryHourAt),
                            })}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {event.companionsCount}
                        {event.companionOrdersUnknown > 0 ? (
                          <p className="text-xs text-warning">
                            {t("unknownOrders", {
                              count: event.companionOrdersUnknown,
                            })}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="min-w-40">
                        <p className="font-semibold tabular-nums">
                          {t("ticketCount", { count: event.salesCount })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {moneySummary(
                            locale,
                            event.salesByCurrency,
                            "grossAmount",
                          )}
                        </p>
                        {event.sales.slice(0, 3).map((sale) => (
                          <div key={sale.orderId} className="mt-1 text-xs">
                            <p className="text-muted-foreground">
                              <span className="font-mono text-foreground">
                                {sale.code ?? t("referral")}
                              </span>
                              {" · "}
                              {t("saleDetail", {
                                count: sale.ticketCount,
                                amount: formatMoney(
                                  locale,
                                  sale.currency,
                                  sale.amount,
                                ),
                              })}
                            </p>
                            {sale.commissionAmount === null ? (
                              <p className="text-warning">
                                {t("saleCommissionPending")}
                              </p>
                            ) : null}
                          </div>
                        ))}
                        {event.sales.length > 3 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("moreOrders", {
                              count: event.sales.length - 3,
                            })}
                          </p>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
