"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@urnight/ui";
import { type AppLocale, toBaseLocale } from "@/lib/i18n/config";
import { setLocale } from "@/lib/i18n/set-locale";

export function LocaleSwitcher({
  id,
  showLabel = false,
}: {
  id: string;
  showLabel?: boolean;
}) {
  // `useLocale()` devuelve el locale regional ('es-PE'/'en-US'); el Select
  // trabaja con el idioma base ('es'/'en').
  const locale: AppLocale = toBaseLocale(useLocale());
  const router = useRouter();
  const t = useTranslations("common.language");
  const [isPending, startTransition] = useTransition();

  function changeLocale(nextLocale: string) {
    startTransition(async () => {
      await setLocale(nextLocale as AppLocale);
      router.refresh();
    });
  }

  return (
    <div className={showLabel ? "space-y-2" : undefined}>
      {showLabel ? <Label htmlFor={id}>{t("label")}</Label> : null}
      <Select value={locale} onValueChange={changeLocale} disabled={isPending}>
        <SelectTrigger
          id={id}
          aria-label={t("label")}
          className={showLabel ? "w-full min-w-40" : "h-11 w-40 shrink-0"}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="es">{t("spanish")}</SelectItem>
          <SelectItem value="en">{t("english")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
