import { Gift, XCircle } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@urnight/ui";
import { EmptyState } from "@/components/shared/empty-state";
import {
  registerRedemptionClick,
  resolveRedemptionCode,
} from "@/lib/api/promoters";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("canjear");
  return { title: t("metadataTitle") };
}

/**
 * Aterrizaje público de un código de canje de promotor (#13). Resuelve el código
 * y, si es válido, muestra el beneficio y enlaza al evento para completarlo.
 */
export default async function CanjearPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const t = await getTranslations("canjear");
  const format = await getFormatter();
  const money = (value: number) =>
    format.number(value, { style: "currency", currency: "PEN" });
  const { code } = await params;

  const data = await resolveRedemptionCode(code).catch(() => null);
  // Atribución del promotor (best-effort, no bloquea la vista).
  void registerRedemptionClick(code).catch(() => {});

  if (!data || !data.valid) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState
          icon={<XCircle className="h-10 w-10" weight="duotone" />}
          title={t("invalid.title")}
          description={data?.reason ?? t("invalid.description")}
          action={
            <Button asChild>
              <Link href="/events">{t("invalid.action")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const benefit = data.isFree
    ? t("freeTicket")
    : data.discountType === "percentage" && data.discountValue != null
      ? t("percentDiscount", { value: data.discountValue })
      : data.discountType === "fixed_amount" && data.discountValue != null
        ? t("amountDiscount", { amount: money(data.discountValue) })
        : t("specialBenefit");

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Gift className="h-6 w-6" weight="duotone" />
          </div>
          <CardTitle className="font-heading text-2xl">{benefit}</CardTitle>
          <CardDescription>
            {t.rich(data.promoterName ? "courtesy" : "promoterCode", {
              promoter: data.promoterName ?? "",
              code: data.code,
              codeTag: (chunks: React.ReactNode) => (
                <span className="font-mono">{chunks}</span>
              ),
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.event ? (
            <div className="space-y-1 rounded-lg border p-4">
              <p className="font-medium">{data.event.name}</p>
              <p className="text-sm text-muted-foreground">
                {format.dateTime(new Date(data.event.startsAt), {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
              {data.ticketType ? (
                <Badge variant="secondary" className="mt-1">
                  {data.ticketType.name} · {money(data.ticketType.price)}
                </Badge>
              ) : null}
            </div>
          ) : null}

          {data.savings > 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              {t.rich("savings", {
                amount: money(data.savings),
                strong: (chunks: React.ReactNode) => (
                  <span className="font-semibold text-foreground">
                    {chunks}
                  </span>
                ),
              })}
            </p>
          ) : null}

          {data.event ? (
            <Button asChild className="w-full">
              <Link href={`/events/${data.event.slug}`}>{t("continue")}</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
