"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ZoneResponse } from "@urnight/contracts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@urnight/ui";

const ALL = "all";

/** Filtro de locales por zona; sincroniza la selección con la query string. */
export function ZoneFilter({ zones }: { zones: ZoneResponse[] }) {
  const t = useTranslations("locals");
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("zoneId") ?? ALL;

  function onChange(value: string) {
    const next = new URLSearchParams(params);
    if (value === ALL) next.delete("zoneId");
    else next.set("zoneId", value);
    router.push(`/locals${next.toString() ? `?${next.toString()}` : ""}`);
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-56" aria-label={t("filterAria")}>
        <SelectValue placeholder={t("allZones")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{t("allZones")}</SelectItem>
        {zones.map((zone) => (
          <SelectItem key={zone.id} value={zone.id}>
            {zone.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
