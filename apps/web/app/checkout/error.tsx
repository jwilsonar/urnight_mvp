"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/shared/error-state";
import { logger } from "@/lib/logger";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("checkout.errorBoundary");

  useEffect(() => {
    logger.error(
      { digest: error.digest, err: error.message },
      "web.checkout.boundary.error",
    );
  }, [error]);

  return (
    <ErrorState
      title={t("title")}
      description={t("description")}
      retryLabel={t("retry")}
      onRetry={reset}
    />
  );
}
