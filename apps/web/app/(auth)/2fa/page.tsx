"use client";

/* Pantalla del prototipo (10 · 2FA verificación). Vista demo: la validación
   real del código requiere backend de 2FA aún no implementado. */

import { Check, ShieldCheck } from "@phosphor-icons/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Badge, Button, cn } from "@urnight/ui";
import { AuthShell } from "@/components/auth/auth-shell";

export default function TwoFaPage() {
  const t = useTranslations("twoFactor");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const complete = digits.every((d) => d !== "");

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
  }

  return (
    <AuthShell>
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-[110px] items-center justify-center rounded-[32px] border border-accent-border bg-accent shadow-glow-lg">
          <ShieldCheck className="size-12 text-rose" weight="duotone" />
        </div>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {t("description")}
        </p>

        <div className="mt-8 flex justify-center gap-2.5 sm:gap-3">
          {digits.map((value, index) => (
            <input
              key={index}
              ref={(el) => {
                refs.current[index] = el;
              }}
              value={value}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !value && index > 0) {
                  refs.current[index - 1]?.focus();
                }
              }}
              maxLength={1}
              inputMode="numeric"
              aria-label={t("digitAria", { number: index + 1 })}
              className={cn(
                "h-14 w-11 rounded-md border-2 bg-white/[0.04] text-center font-heading text-2xl font-extrabold outline-none transition-colors sm:h-16 sm:w-[52px]",
                value ? "border-primary" : "border-input",
                "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40",
              )}
            />
          ))}
        </div>

        <div className="mt-7 flex flex-col items-center gap-4">
          {complete ? (
            <span className="flex items-center gap-2 text-sm font-semibold text-success">
              <Check className="size-4" /> {t("complete")}
            </span>
          ) : (
            <p className="text-sm text-muted-foreground">{t("notReceived")}</p>
          )}
          <Badge variant="info">{t("demo")}</Badge>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">{t("backToLogin")}</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
