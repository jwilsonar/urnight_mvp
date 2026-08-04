import { Armchair } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge, Button, Card } from "@urnight/ui";
import { BrandQr } from "@/components/shared/brand-qr";
import { MIS_RESERVAS_DEMO } from "@/lib/mock/reservas";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.reservations");
  return { title: t("title"), description: t("description") };
}

const ESTADO: Record<string, "success" | "warning" | "outline"> = {
  confirmada: "success",
  pendiente: "warning",
  completada: "outline",
};

/** Pantalla R6 del prototipo (Mis reservas). Demo frontend-only. */
export default async function MisReservasPage() {
  const [t, format] = await Promise.all([
    getTranslations("account.reservations"),
    getFormatter(),
  ]);
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-xl font-extrabold tracking-tight">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Badge variant="info">{t("demo")}</Badge>
      </div>

      <div className="space-y-3.5">
        {MIS_RESERVAS_DEMO.map((reserva) => {
          const variant = ESTADO[reserva.estado] ?? "outline";
          return (
            <Card key={reserva.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={variant}>
                      {t(`status.${reserva.estado}`)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {t(`items.${reserva.id}.date`)}
                    </span>
                  </div>
                  <p className="mt-2 font-heading text-lg font-extrabold">
                    {reserva.evento}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Armchair className="size-3.5" weight="duotone" />
                    {t(`items.${reserva.id}.table`)} ·{" "}
                    {t("people", { count: reserva.pax })} · {reserva.venue}
                  </p>
                </div>
                {/* El QR es lo que escanea la puerta; el código en texto queda
                    como respaldo si el escáner falla. */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="rv-eyebrow !text-muted-foreground">
                      {t("code")}
                    </p>
                    <p className="font-mono text-lg font-bold tracking-widest text-rose">
                      {reserva.codigo}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("deposit", {
                        amount: format.number(reserva.deposito, {
                          style: "currency",
                          currency: "PEN",
                          maximumFractionDigits: 0,
                        }),
                      })}
                    </p>
                  </div>
                  <BrandQr
                    value={reserva.codigo}
                    alt={t("qrAlt", { code: reserva.codigo })}
                    size={104}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <Button variant="outline" asChild>
          <Link href="/reserva">{t("bookAnother")}</Link>
        </Button>
      </div>
    </div>
  );
}
