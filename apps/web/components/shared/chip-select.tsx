'use client';

import { Label, cn } from '@urnight/ui';

export interface ChipOption {
  id: string;
  name: string;
}

interface ChipSelectProps {
  label: string;
  hint?: string;
  options: ReadonlyArray<ChipOption>;
  selected: string[];
  onToggle: (id: string) => void;
  emptyHint: string;
}

/** Multiselección por chips (categorías, etiquetas del catálogo, etc.). */
export function ChipSelect({ label, hint, options, selected, onToggle, emptyHint }: ChipSelectProps) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </Label>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const active = selected.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={active}
                onClick={() => onToggle(o.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:border-primary hover:text-foreground',
                )}
              >
                {o.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
