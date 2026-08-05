"use client";

import { ArrowClockwise, Warning } from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle, Button } from "@urnight/ui";
import { useTranslations } from "next-intl";
import { handleSessionExpired } from "@/lib/auth/session-expiry";

export function SessionRecoveryState() {
  const t = useTranslations("account.sessionRecovery");
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
      <Alert variant="destructive" className="text-left">
        <Warning className="size-4" />
        <AlertTitle>{t("title")}</AlertTitle>
        <AlertDescription>{t("description")}</AlertDescription>
      </Alert>
      <Button type="button" onClick={handleSessionExpired}>
        <ArrowClockwise className="size-4" /> {t("action")}
      </Button>
    </div>
  );
}
