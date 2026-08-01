"use client";

import { Label, cn } from "@urnight/ui";

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
export function ChipSelect({
  label,
  hint,
  options,
  selected,
  onToggle,
  emptyHint,
}: ChipSelectProps) {
  return (
    <div className="space-y-2">
      <Label>
        {label}{" "}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
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
                  "whitespace-nowrap rounded-full border border-border bg-card px-3 py-1 text-sm font-medium transition-colors",
                  active
                    ? "border-accent-border bg-accent font-semibold text-foreground"
                    : "text-muted-foreground hover:border-[var(--accent-border-subtle)] hover:bg-[var(--accent-soft-faint)] hover:text-foreground",
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
