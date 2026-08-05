"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { logger } from "@/lib/logger";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("auth");

  useEffect(() => {
    logger.error(
      { digest: error.digest, err: error.message },
      "web.auth.boundary.error",
    );
  }, [error]);

  return <ErrorState title={t("boundaryTitle")} onRetry={reset} />;
}
