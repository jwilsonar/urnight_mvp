import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge, Button, Card } from "@urnight/ui";
import { BADGES_DEMO, NIVEL_DEMO } from "@/lib/mock/fidelizacion";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("puntos.levels");
  return { title: t("metadataTitle"), description: t("description") };
}

/** Pantalla 37 del prototipo. Demo frontend-only (sin backend de puntos). */
export default async function NivelesPage() {
  const [t, format] = await Promise.all([
    getTranslations("puntos.levels"),
    getFormatter(),
  ]);
  const unlocked = BADGES_DEMO.filter((b) => b.unlocked).length;
  const badges = t.raw("badges") as { name: string; description: string }[];
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

      {/* Card de nivel con gradiente dorado→carmín del prototipo */}
      <div className="rounded-xl border border-warning-border bg-[linear-gradient(135deg,var(--warning-soft),var(--accent-soft))] p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex size-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffd700,#f59e0b)] text-4xl shadow-[0_0_40px_rgba(245,158,11,0.4)]">
            🥇
          </div>
          <div className="min-w-0 flex-1">
            <p className="rv-eyebrow text-warning">{t("currentLevel")}</p>
            <p className="font-heading text-2xl font-black sm:text-3xl">
              {t(`levelNames.${NIVEL_DEMO.actual}`)} ·{" "}
              {format.number(NIVEL_DEMO.puntos)} {t("pointsShort")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("nextLevel")}:{" "}
              <strong className="text-foreground">
                {t(`levelNames.${NIVEL_DEMO.siguiente}`)} ·{" "}
                {format.number(NIVEL_DEMO.puntosSiguiente)} {t("pointsShort")}
              </strong>{" "}
              ·{" "}
              {t("remaining", {
                count: NIVEL_DEMO.puntosSiguiente - NIVEL_DEMO.puntos,
              })}
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#ffd700,var(--color-primary))]"
                style={{ width: `${NIVEL_DEMO.progresoPct}%` }}
              />
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <Button variant="secondary" asChild>
              <Link href="/account/puntos#historial">{t("viewHistory")}</Link>
            </Button>
            <Button asChild>
              <Link href="/account/puntos#canjear">{t("redeemPoints")}</Link>
            </Button>
          </div>
        </div>
      </div>

      <h3 className="mb-4 mt-7 text-[15px] font-bold">
        {t("badgesTitle")}{" "}
        <span className="font-medium text-muted-foreground">
          · {t("unlocked", { unlocked, total: BADGES_DEMO.length })}
        </span>
      </h3>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
        {BADGES_DEMO.map((b, index) => (
          <Card
            key={b.nombre}
            className={`p-4 text-center ${b.unlocked ? "" : "opacity-40 grayscale"}`}
          >
            <p className="text-3xl">{b.icono}</p>
            <p className="mt-2 text-[13px] font-bold leading-tight">
              {badges[index]?.name}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              {badges[index]?.description}
            </p>
            {!b.unlocked ? (
              <p className="rv-eyebrow mt-2 !text-muted-foreground">
                🔒 {t("locked")}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
