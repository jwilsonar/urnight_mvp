import { cn } from '@urnight/ui';

interface ProgressCellProps {
  value: number;
  max: number;
  tone: 'primary' | 'warning' | 'error';
  ariaLabel: string;
}

const TONE_CLASS: Record<ProgressCellProps['tone'], string> = {
  primary: 'bg-primary',
  warning: 'bg-warning',
  error: 'bg-error',
};

/** Métrica compacta con barra de progreso para celdas de DataTable. */
export function ProgressCell({ value, max, tone, ariaLabel }: ProgressCellProps) {
  const safeMax = Math.max(max, 0);
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  const percentage = safeMax > 0 ? (safeValue / safeMax) * 100 : 0;
  const progressMax = Math.max(safeMax, 1);

  return (
    <div className="min-w-24 space-y-1">
      <span className="text-xs tabular-nums text-muted-foreground">
        {value}/{max}
      </span>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={progressMax}
        aria-valuenow={safeValue}
        aria-label={ariaLabel}
        className="h-1.5 overflow-hidden rounded-full bg-surface"
      >
        <div
          className={cn('h-full rounded-full', TONE_CLASS[tone])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
