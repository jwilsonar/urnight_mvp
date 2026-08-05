"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from "@urnight/ui";
import { TicketCard } from "@/components/tickets/ticket-card";
import type { CheckoutResult } from "@/lib/api/orders";

/** Vista de confirmación tras un checkout exitoso (orden + entradas emitidas). */
export function CheckoutSuccess({ result }: { result: CheckoutResult }) {
  const t = useTranslations("checkout.success");
  const format = useFormatter();
  const money = (value: number) =>
    format.number(value, { style: "currency", currency: "PEN" });
  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          {t.rich("confirmed", {
            code: result.order.orderCode,
            strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
          })}
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("summary")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row label={t("subtotal")} value={money(result.order.subtotal)} />
          {result.order.discountTotal > 0 ? (
            <Row
              label={t("discount")}
              value={`- ${money(result.order.discountTotal)}`}
            />
          ) : null}
          <Separator className="my-2" />
          <Row label={t("total")} value={money(result.order.total)} strong />
        </CardContent>
      </Card>
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t("tickets")}</h2>
        {result.tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
      <Button asChild className="w-full">
        <Link href="/account/tickets">{t("viewTickets")}</Link>
      </Button>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${strong ? "text-base font-semibold" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span className={strong ? "text-foreground" : undefined}>{value}</span>
    </div>
  );
}
