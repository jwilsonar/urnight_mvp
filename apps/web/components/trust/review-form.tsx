"use client";

import { Star } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { CreateReviewDto } from "@urnight/contracts";
import { Button, Label, Textarea, cn } from "@urnight/ui";
import { createReview } from "@/lib/api/trust";
import { useTokenAction } from "@/lib/hooks/use-token-action";

/** Formulario de reseña. Solo válido para compradores con asistencia verificada (backend valida). */
export function ReviewForm({
  eventId,
  ticketId,
  onDone,
}: {
  eventId: string;
  ticketId: string;
  onDone?: () => void;
}) {
  const t = useTranslations("common.reviewForm");
  const router = useRouter();
  const { run, pending } = useTokenAction();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  function submit() {
    if (rating < 1) {
      toast.error(t("ratingRequired"));
      return;
    }
    const dto: CreateReviewDto = {
      targetType: "event",
      eventId,
      ticketId,
      rating,
      comment: comment.trim() ? comment : undefined,
    };
    run((token) => createReview(dto, token), {
      successMessage: t("success"),
      onSuccess: () => {
        onDone?.();
        router.refresh();
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("rating")}</Label>
        <div className="flex gap-1" role="radiogroup" aria-label={t("rating")}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={t("stars", { count: value })}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(value)}
              className="rounded-sm p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                className={cn(
                  "h-7 w-7",
                  value <= (hover || rating)
                    ? "text-primary"
                    : "text-muted-foreground/30",
                )}
                weight={value <= (hover || rating) ? "fill" : "regular"}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="review-comment">{t("comment")}</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={2000}
          placeholder={t("placeholder")}
        />
      </div>
      <Button onClick={submit} disabled={pending} className="w-full">
        {pending ? t("sending") : t("submit")}
      </Button>
    </div>
  );
}
