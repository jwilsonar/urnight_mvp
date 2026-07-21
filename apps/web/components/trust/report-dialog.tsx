"use client";

import { Flag } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { CreateReportDto } from "@urnight/contracts";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@urnight/ui";
import { createReport } from "@/lib/api/trust";
import { useTokenAction } from "@/lib/hooks/use-token-action";

const REASONS: CreateReportDto["reason"][] = [
  "cancelled",
  "wrong_price",
  "wrong_location",
  "unsafe",
  "other",
];

interface ReportDialogProps {
  targetType: CreateReportDto["targetType"];
  targetId: string;
}

/** Reporta un local o evento. Requiere sesión; si no hay, lleva a login. */
export function ReportDialog({ targetType, targetId }: ReportDialogProps) {
  const t = useTranslations("common.report");
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { run, pending } = useTokenAction();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<CreateReportDto["reason"]>("other");
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const commentRef = useRef<HTMLTextAreaElement>(null);

  if (!session?.user) {
    return (
      <Button
        variant="outline"
        size="sm"
        // callbackUrl: tras loguearse el usuario vuelve AQUÍ (al evento/local
        // que quería reportar), no al home.
        onClick={() =>
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
        }
      >
        <Flag className="h-4 w-4" /> {t("action")}
      </Button>
    );
  }

  function submit() {
    const cleanComment = comment.trim();
    if (reason === "other" && !cleanComment) {
      setCommentError(t("commentRequired"));
      commentRef.current?.focus();
      return;
    }

    const dto: CreateReportDto = {
      targetType,
      ...(targetType === "local"
        ? { localId: targetId }
        : { eventId: targetId }),
      reason,
      comment: cleanComment || undefined,
      severity: "low",
    };
    run((token) => createReport(dto, token), {
      successMessage: t("success"),
      onSuccess: () => {
        setOpen(false);
        setComment("");
        setCommentError("");
        if (commentRef.current) commentRef.current.style.height = "auto";
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Outline: el botón necesita límites visibles (feedback de Piero); el
            hover sombreado del DS se conserva. */}
        <Button variant="outline" size="sm">
          <Flag className="h-4 w-4" /> {t("action")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("title", { target: t(`target.${targetType}`) })}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-reason">{t("reasonLabel")}</Label>
            <Select
              value={reason}
              onValueChange={(value) => {
                const nextReason = value as CreateReportDto["reason"];
                setReason(nextReason);
                if (nextReason !== "other") setCommentError("");
              }}
            >
              <SelectTrigger id="report-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((reasonOption) => (
                  <SelectItem key={reasonOption} value={reasonOption}>
                    {t(`reason.${reasonOption}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-comment">
              {reason === "other" ? t("commentLabel") : t("commentOptional")}
            </Label>
            <Textarea
              ref={commentRef}
              id="report-comment"
              value={comment}
              onChange={(event) => {
                const textarea = event.currentTarget;
                setComment(textarea.value);
                if (textarea.value.trim()) setCommentError("");
                textarea.style.height = "auto";
                textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`;
              }}
              maxLength={2000}
              required={reason === "other"}
              aria-invalid={Boolean(commentError)}
              aria-describedby={
                commentError ? "report-comment-error" : undefined
              }
              className="min-h-24 max-h-48 resize-none overflow-y-auto"
              placeholder={t("placeholder")}
            />
            {commentError ? (
              <p
                id="report-comment-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {commentError}
              </p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {t("cancel")}
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? t("sending") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
