"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@urnight/ui";

/** Alterna claro/oscuro. Evita mismatch de hidratación esperando el montaje. */
export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const t = useTranslations("common.theme");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  // Antes de montar no conocemos el tema resuelto: placeholder neutro (icono
  // oculto pero con el mismo tamaño) para no mostrar el icono equivocado 1 frame.
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={showLabel ? "default" : "icon"}
        className={showLabel ? "w-full justify-start" : undefined}
        aria-label={t("change")}
        disabled
      >
        <Sun className="h-5 w-5 opacity-0" />
        {showLabel ? t("change") : null}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      className={showLabel ? "w-full justify-start" : undefined}
      aria-label={isDark ? t("activateLight") : t("activateDark")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      {showLabel
        ? isDark
          ? t("activateLight")
          : t("activateDark")
        : null}
    </Button>
  );
}
