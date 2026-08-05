"use client";

import { type FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Input, Label } from "@urnight/ui";

export function EventPriceFilter() {
  const t = useTranslations("events.filters.price");
  const router = useRouter();
  const params = useSearchParams();
  const currentMin = params.get("minPrice") ?? "";
  const currentMax = params.get("maxPrice") ?? "";
  const [minPrice, setMinPrice] = useState(currentMin);
  const [maxPrice, setMaxPrice] = useState(currentMax);
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const min = minPrice === "" ? undefined : Number(minPrice);
    const max = maxPrice === "" ? undefined : Number(maxPrice);
    if (min !== undefined && max !== undefined && max < min) {
      setError(t("invalidRange"));
      return;
    }

    const next = new URLSearchParams(params);
    if (min === undefined) next.delete("minPrice");
    else next.set("minPrice", String(min));
    if (max === undefined) next.delete("maxPrice");
    else next.set("maxPrice", String(max));
    next.delete("page");
    next.delete("offset");
    setError("");
    router.push(`/events${next.size > 0 ? `?${next.toString()}` : ""}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
        <Label className="min-w-0 space-y-1 text-xs">
          <span>{t("minimum")}</span>
          <Input
            name="minPrice"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            className="h-9 w-full sm:w-28"
            aria-describedby={error ? "event-price-error" : undefined}
          />
        </Label>
        <Label className="min-w-0 space-y-1 text-xs">
          <span>{t("maximum")}</span>
          <Input
            name="maxPrice"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            className="h-9 w-full sm:w-28"
            aria-describedby={error ? "event-price-error" : undefined}
          />
        </Label>
        <Button
          type="submit"
          size="sm"
          className="col-span-2 h-9 w-full sm:w-24"
        >
          {t("apply")}
        </Button>
      </div>
      {error ? (
        <p
          id="event-price-error"
          className="text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
