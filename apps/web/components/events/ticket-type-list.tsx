import { Ticket } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import type { TicketTypeResponse } from "@urnight/contracts";
import { Button, Card, CardContent } from "@urnight/ui";
import { EmptyState } from "@/components/shared/empty-state";

/** Lista de tipos de entrada. Regla: no se muestra precio sin stock disponible. */
export function TicketTypeList({
  ticketTypes,
  eventSlug,
  canBuy,
}: {
  ticketTypes: TicketTypeResponse[];
  eventSlug: string;
  canBuy: boolean;
}) {
  const t = useTranslations("events.tickets");
  const format = useFormatter();
  if (ticketTypes.length === 0) {
    return (
      <EmptyState
        compact
        icon={<Ticket weight="duotone" />}
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {ticketTypes.map((tt) => {
        const soldOut = tt.status === "sold_out" || tt.remaining <= 0;
        return (
          <Card key={tt.id}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-1">
                <span className="font-medium">{tt.name}</span>
                {soldOut ? (
                  <span className="text-sm text-destructive">
                    {t("soldOut")}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-foreground">
                    {format.number(tt.price, {
                      style: "currency",
                      currency: "PEN",
                    })}
                  </span>
                )}
              </div>
              {!soldOut && canBuy ? (
                <span className="text-xs text-muted-foreground">
                  {t("available", { count: tt.remaining })}
                </span>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {canBuy ? (
        <Button asChild className="w-full" size="lg">
          <Link href={`/checkout?event=${eventSlug}`}>
            <Ticket className="h-4 w-4" /> {t("buy")}
          </Link>
        </Button>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          {t("unavailable")}
        </p>
      )}
    </div>
  );
}
