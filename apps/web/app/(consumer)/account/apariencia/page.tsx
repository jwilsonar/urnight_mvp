"use client";

import { Check, Desktop, Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ComponentType } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@urnight/ui";

type ThemeChoice = "system" | "light" | "dark";

const OPTIONS: Array<{
  value: ThemeChoice;
  labelKey: ThemeChoice;
  hintKey: `${ThemeChoice}Hint`;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "system", labelKey: "system", hintKey: "systemHint", icon: Desktop },
  { value: "light", labelKey: "light", hintKey: "lightHint", icon: Sun },
  { value: "dark", labelKey: "dark", hintKey: "darkHint", icon: Moon },
];

export default function AppearancePage() {
  const t = useTranslations("account.appearance");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          role="radiogroup"
          aria-label={t("title")}
          className="grid gap-2 rounded-xl border bg-muted/40 p-1 sm:grid-cols-3"
        >
          {OPTIONS.map(({ value, labelKey, hintKey, icon: Icon }) => {
            const active = mounted && theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!mounted}
                onClick={() => setTheme(value)}
                className={cn(
                  "relative flex min-h-11 items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                  active
                    ? "border-primary bg-background text-foreground shadow-sm"
                    : "border-transparent text-muted-foreground hover:bg-background/70 hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {t(labelKey)}
                  </span>
                  <span className="block text-xs leading-4">{t(hintKey)}</span>
                </span>
                {active ? (
                  <Check
                    className="ml-auto h-4 w-4 shrink-0 text-primary"
                    weight="bold"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
