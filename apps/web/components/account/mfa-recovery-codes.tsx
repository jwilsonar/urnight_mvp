"use client";

import { Check, Copy, DownloadSimple, Warning } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@urnight/ui";

export function MfaRecoveryCodes({
  codes,
  sessionRefreshFailed = false,
  onDone,
}: {
  codes: readonly string[];
  sessionRefreshFailed?: boolean;
  onDone: () => void;
}) {
  const t = useTranslations("account.security.recoveryCodes");
  const [copied, setCopied] = useState(false);

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function downloadCodes() {
    const body = `${t("downloadHeading")}\n\n${codes.join("\n")}\n`;
    const url = URL.createObjectURL(
      new Blob([body], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ravenue-recovery-codes.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert className="border-accent-border bg-accent/60">
          <Warning aria-hidden="true" className="size-5 text-rose" />
          <AlertTitle>{t("oneTimeTitle")}</AlertTitle>
          <AlertDescription>{t("oneTimeDescription")}</AlertDescription>
        </Alert>

        {sessionRefreshFailed ? (
          <Alert variant="destructive">
            <AlertDescription>{t("refreshFailed")}</AlertDescription>
          </Alert>
        ) : null}

        <ol
          className="grid gap-2 rounded-lg border bg-muted/40 p-4 sm:grid-cols-2"
          aria-label={t("listAria")}
        >
          {codes.map((code, index) => (
            <li
              key={code}
              className="flex items-center gap-3 rounded-md bg-background px-3 py-2 font-mono text-sm font-semibold tracking-wide"
            >
              <span className="w-5 text-right text-xs text-muted-foreground">
                {index + 1}.
              </span>
              {code}
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={copyCodes}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? t("copied") : t("copy")}
          </Button>
          <Button type="button" variant="outline" onClick={downloadCodes}>
            <DownloadSimple className="size-4" />
            {t("download")}
          </Button>
          <Button type="button" className="sm:ml-auto" onClick={onDone}>
            {t("done")}
          </Button>
        </div>
        <span className="sr-only" aria-live="polite">
          {copied ? t("copied") : ""}
        </span>
      </CardContent>
    </Card>
  );
}
