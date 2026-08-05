"use client";

import { Gift, Ticket } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@urnight/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { listMyRedemptions } from "@/lib/api/promoters";
import { queryKeys } from "@/lib/api/query-keys";

/** Canjes de códigos promocionales del usuario (#13). GET /me/redemptions. */
export function RedemptionsList() {
  const t = useTranslations("account.redemptionsList");
  const format = useFormatter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.myRedemptions,
    queryFn: () => listMyRedemptions(token),
    enabled: Boolean(token),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<Gift weight="duotone" />}
        title={t("empty.title")}
        description={t("empty.description")}
        action={
          <Button asChild>
            <Link href="/events">{t("empty.action")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {data.map((redemption) => (
        <li
          key={redemption.id}
          className="flex min-w-0 flex-col gap-2 rounded-md border p-3 text-sm sm:justify-between"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Ticket className="size-4 text-primary" weight="fill" />
            <span className="truncate">
              {t("discount", {
                amount: format.number(redemption.discountApplied, {
                  style: "currency",
                  currency: "PEN",
                }),
              })}
            </span>
          </span>
          <span className="text-muted-foreground">
            {format.dateTime(new Date(redemption.redeemedAt), {
              dateStyle: "short",
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
