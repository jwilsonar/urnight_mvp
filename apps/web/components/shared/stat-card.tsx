import { CaretDown, CaretUp } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { Card, Skeleton, cn } from "@urnight/ui";

/** Tono del texto de apoyo (hint) y del delta. */
type StatTone = "muted" | "accent" | "success" | "warning" | "destructive";

const TONE: Record<StatTone, string> = {
  muted: "text-muted-foreground",
  accent: "text-rose",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export interface StatCardProps {
  /** Etiqueta superior (eyebrow). */
  label: string;
  /** Cifra principal. */
  value: ReactNode;
  /** Icono Phosphor duotone opcional (mark accent arriba-derecha). */
  icon?: ReactNode;
  /** Texto de apoyo bajo la cifra. */
  hint?: string;
  /** Tono del hint. */
  tone?: StatTone;
  /** Tendencia opcional (flecha + %). `up` = bueno por defecto. */
  delta?: { value: string; direction: "up" | "down" };
  className?: string;
}

/**
 * Stat card canónica del DS: eyebrow + cifra grande + hint con tono + icono y
 * delta opcionales. Unifica las tres variantes que había sueltas por los
 * paneles (admin plano, promoter rv-eyebrow, reclamaciones dl) en un solo
 * componente. Estructura tomada del patrón 21st "metric card with trend",
 * revestida con tokens del DS (rv-eyebrow, text-rose/success/warning).
 */
export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "muted",
  delta,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="rv-eyebrow !text-muted-foreground">{label}</p>
        {icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent-border bg-accent text-rose [&_svg]:size-[18px]">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-heading text-3xl font-extrabold tracking-tight tabular-nums">
        {value}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-bold",
              delta.direction === "up" ? "text-success" : "text-destructive",
            )}
          >
            {delta.direction === "up" ? (
              <CaretUp className="size-3" weight="bold" />
            ) : (
              <CaretDown className="size-3" weight="bold" />
            )}
            {delta.value}
          </span>
        ) : null}
        {hint ? (
          <p className={cn("text-xs font-semibold", TONE[tone])}>{hint}</p>
        ) : null}
      </div>
    </Card>
  );
}

/** Skeleton de carga a juego (misma altura aprox. que la StatCard). */
export function StatCardSkeleton() {
  return <Skeleton className="h-[104px] rounded-lg" />;
}
