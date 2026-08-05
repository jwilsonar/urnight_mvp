import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
} from "@urnight/ui";
import { useTranslations } from "next-intl";
import type { CrowdDemo, CrowdNivelDemo } from "@/lib/mock/crowd";

const NIVEL_ESTILOS: Record<CrowdNivelDemo, string> = {
  bajo: "border-success-border bg-success-soft text-success",
  medio: "border-warning-border bg-warning-soft text-warning",
  lleno: "border-error-border bg-error-soft text-error",
};

export function CrowdMeter({ crowd }: { crowd: CrowdDemo }) {
  const t = useTranslations("locals.crowd");
  const porcentaje = Math.round((crowd.dentro / crowd.capacidad) * 100);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <CardTitle className="font-heading text-lg">{t("title")}</CardTitle>
        <Badge variant="info">{t("demo")}</Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-3">
          <p className="font-heading text-4xl font-black tracking-tight tabular-nums">
            {porcentaje}%
          </p>
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-semibold",
              NIVEL_ESTILOS[crowd.nivel],
            )}
          >
            {t(`level.${crowd.nivel}`)}
          </span>
        </div>
        {/* El ancho expresa la lectura del aforo; el token mantiene el color dentro del sistema. */}
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="mt-4 text-sm font-semibold">
          {crowd.esperaMin > 0
            ? t("wait", { minutes: crowd.esperaMin })
            : t("noLine")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("updated", { minutes: crowd.actualizadoMin })}
        </p>
      </CardContent>
    </Card>
  );
}
