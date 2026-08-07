import { Bank, Plus } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge, Button, Card } from "@urnight/ui";
import { WALLET_DEMO } from "@/lib/mock/fidelizacion";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.wallet");
  return { title: t("title"), description: t("description") };
}

/** Pantalla 35 del prototipo. Demo frontend-only (sin backend de wallet). */
export default async function WalletPage() {
  const [t, format] = await Promise.all([
    getTranslations("account.wallet"),
    getFormatter(),
  ]);
  const transactions = t.raw("transactions") as {
    date: string;
    concept: string;
  }[];
  const money = (value: number) =>
    format.number(value, { style: "currency", currency: "PEN" });
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

      {/* Card de saldo con gradiente carmín del prototipo */}
      <div className="rounded-xl border border-accent-border bg-[linear-gradient(135deg,var(--accent-soft-strong),var(--accent-soft))] p-6 sm:p-7">
        <p className="rv-eyebrow">{t("availableBalance")}</p>
        <p className="mt-1 font-heading text-5xl font-black tracking-tight">
          {money(WALLET_DEMO.saldo)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{t("equivalence")}</p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button disabled className="w-44 justify-center">
            <Plus className="size-4" /> {t("topUp")}
          </Button>
          <Button variant="secondary" disabled className="w-44 justify-center">
            <Bank className="size-4" weight="duotone" /> {t("withdraw")}
          </Button>
        </div>
        {/* El retiro no es instantáneo: lo procesa una persona y el abono
            depende del banco. Decirlo aquí evita que alguien lo dé por caído
            cuando el dinero no aparece en minutos. */}
        <p className="mt-3 max-w-prose text-xs text-muted-foreground">
          {t("withdrawNotice")}
        </p>
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        <div className="border-b px-5 py-3.5">
          <h3 className="text-[15px] font-bold">{t("recent")}</h3>
        </div>
        {WALLET_DEMO.movimientos.map((m, index) => (
          <div
            key={`${m.fecha}-${m.concepto}`}
            className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b px-5 py-3.5 text-sm last:border-b-0 sm:grid-cols-[130px_1fr_120px]"
          >
            <span className="font-mono text-xs text-muted-foreground">
              {transactions[index]?.date}
            </span>
            <span className="col-span-2 sm:col-span-1">
              {transactions[index]?.concept}
            </span>
            {/* Fuera el saldo corrido en gris del extremo derecho: competía con
                el monto del movimiento, que es el dato que se busca, y lo
                empujaba lejos del borde. El saldo ya está arriba, en grande. */}
            <span
              className={
                m.tipo === "in"
                  ? "text-right font-bold text-success"
                  : "text-right font-bold text-destructive"
              }
            >
              {m.monto > 0 ? "+" : ""}
              {money(m.monto)}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
