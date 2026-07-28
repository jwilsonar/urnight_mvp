"use client";

/* Botón "Limpiar cookies" del footer del prototipo. Borra las cookies
   accesibles desde JS (las httpOnly, como la sesión, no son alcanzables) y
   confirma visualmente. Sin llamadas de red. */

import { Check } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@urnight/ui";

export function ClearCookiesButton() {
  const t = useTranslations("footer");
  const [cleared, setCleared] = useState(false);

  function clearCookies() {
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0]?.trim();
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    }
    setCleared(true);
    setTimeout(() => setCleared(false), 2500);
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="w-40 shrink-0"
      onClick={clearCookies}
    >
      <span
        aria-live="polite"
        aria-atomic="true"
        className="inline-flex h-5 items-center justify-center gap-1.5"
      >
        {cleared ? (
          <>
            <Check className="size-3.5" /> {t("cookiesCleared")}
          </>
        ) : (
          t("clearCookies")
        )}
      </span>
    </Button>
  );
}
