"use client";

import { Check, Minus } from "@phosphor-icons/react";
import { Label, cn } from "@urnight/ui";

export interface ChipOption {
  id: string;
  name: string;
}

export function toggleChipSelection(list: string[], id: string): string[] {
  return list.includes(id)
    ? list.filter((value) => value !== id)
    : [...list, id];
}

interface ChipSelectProps {
  label: string;
  hint?: string;
  options: ReadonlyArray<ChipOption>;
  selected: string[];
  onToggle: (id: string) => void;
  emptyHint: string;
  selectAllLabel?: string;
  onSelectAll?: (ids: string[]) => void;
}

/** Multiselección por chips (categorías, etiquetas del catálogo, etc.). */
export function ChipSelect({
  label,
  hint,
  options,
  selected,
  onToggle,
  emptyHint,
  selectAllLabel,
  onSelectAll,
}: ChipSelectProps) {
  const selectedOptionCount = options.filter((option) =>
    selected.includes(option.id),
  ).length;
  const allSelected =
    options.length > 0 && selectedOptionCount === options.length;
  const someSelected = selectedOptionCount > 0 && !allSelected;

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
          {selectAllLabel && onSelectAll ? (
            <button
              type="button"
              role="checkbox"
              aria-checked={someSelected ? "mixed" : allSelected}
              onClick={() =>
                onSelectAll(
                  allSelected ? [] : options.map((option) => option.id),
                )
              }
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card px-3 py-1 text-sm font-medium transition-colors",
                allSelected
                  ? "border-accent-border bg-accent font-semibold text-foreground"
                  : someSelected
                    ? "border-dashed border-accent-border bg-accent/50 text-foreground"
                    : "text-muted-foreground hover:border-[var(--accent-border-subtle)] hover:bg-[var(--accent-soft-faint)] hover:text-foreground",
              )}
            >
              <span
                className="flex size-4 items-center justify-center rounded-sm border border-current"
                aria-hidden="true"
              >
                {allSelected ? (
                  <Check className="size-3" weight="bold" />
                ) : someSelected ? (
                  <Minus className="size-3" weight="bold" />
                ) : null}
              </span>
              {selectAllLabel}
              {someSelected ? (
                <span className="text-xs text-muted-foreground">
                  {selectedOptionCount}/{options.length}
                </span>
              ) : null}
            </button>
          ) : null}
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
