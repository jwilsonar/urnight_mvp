import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import {
  Badge,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@urnight/ui";
import { PointsRedemptionGrid } from "@/components/account/points-redemption-grid";
import { Reveal } from "@/components/shared/reveal";
import { HISTORIAL_PUNTOS_DEMO, NIVEL_DEMO } from "@/lib/mock/fidelizacion";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("puntos");
  return { title: t("title") };
}

/** Demo frontend: el saldo, los canjes y el historial vendrán de fidelización. */
export default async function PuntosPage() {
  const [t, format] = await Promise.all([
    getTranslations("puntos"),
    getFormatter(),
  ]);
  const history = t.raw("history.items") as { date: string; concept: string }[];
  return (
    <div className="space-y-8">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <Badge variant="info">{t("demo")}</Badge>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <Card className="border-accent-border bg-accent-soft">
          <CardContent className="p-6 sm:p-7">
            <p className="rv-eyebrow">{t("balance")}</p>
            <p className="mt-1 font-heading text-5xl font-black tracking-tight tabular-nums">
              {format.number(NIVEL_DEMO.puntos)}
              <span className="ml-2 text-lg font-bold text-muted-foreground">
                {t("pointsShort")}
              </span>
            </p>
            <p className="mt-2 text-sm font-semibold text-rose">
              {t("equivalent", {
                amount: format.number(NIVEL_DEMO.puntos / 10, {
                  style: "currency",
                  currency: "PEN",
                }),
              })}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("validity")}
            </p>
          </CardContent>
        </Card>
      </Reveal>

      <section id="canjear" className="scroll-mt-24">
        <Reveal delay={100}>
          <div>
            <h2 className="font-heading text-xl font-extrabold">
              {t("redeem.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("redeem.description")}
            </p>
          </div>
        </Reveal>
        <PointsRedemptionGrid />
      </section>

      <section id="historial" className="scroll-mt-24">
        <Reveal delay={180}>
          <h2 className="font-heading text-xl font-extrabold">
            {t("history.title")}
          </h2>
        </Reveal>
        <Reveal delay={220}>
          <Card className="mt-4 overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("history.date")}</TableHead>
                  <TableHead>{t("history.concept")}</TableHead>
                  <TableHead className="text-right">
                    {t("history.points")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {HISTORIAL_PUNTOS_DEMO.map((movimiento, index) => (
                  <TableRow
                    key={`${movimiento.fechaLabel}-${movimiento.concepto}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {history[index]?.date}
                    </TableCell>
                    <TableCell>{history[index]?.concept}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-bold tabular-nums",
                        movimiento.tipo === "gana" && "text-success",
                      )}
                    >
                      {movimiento.puntos > 0 ? "+" : ""}
                      {format.number(movimiento.puntos)} {t("pointsShort")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
