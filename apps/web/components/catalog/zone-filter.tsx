"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ZoneResponse } from "@urnight/contracts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@urnight/ui";

const ALL = "all";

/** Filtro de locales por zona; sincroniza la selección con la query string. */
export function ZoneFilter({
  zones,
  pathname,
  ariaLabel,
  allLabel,
  className,
}: {
  zones: ZoneResponse[];
  pathname: "/events" | "/locals";
  ariaLabel: string;
  allLabel: string;
  className?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("zoneId") ?? ALL;

  function onChange(value: string) {
    const next = new URLSearchParams(params);
    if (value === ALL) next.delete("zoneId");
    else next.set("zoneId", value);
    next.delete("page");
    next.delete("offset");
    router.push(`${pathname}${next.toString() ? `?${next.toString()}` : ""}`);
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger
        className={cn("w-full sm:w-56", className)}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {zones.map((zone) => (
          <SelectItem key={zone.id} value={zone.id}>
            {zone.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
