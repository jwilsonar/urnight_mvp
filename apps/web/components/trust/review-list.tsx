import { ChatCircle, SealCheck } from "@phosphor-icons/react/dist/ssr";
import type { ReviewResponse } from "@urnight/contracts";
import { useFormatter, useTranslations } from "next-intl";
import { Card, CardContent } from "@urnight/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { StarRating } from "./star-rating";

export function ReviewList({ reviews }: { reviews: ReviewResponse[] }) {
  const t = useTranslations("common.reviews");
  const format = useFormatter();
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<ChatCircle weight="duotone" />}
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  const average =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StarRating value={average} size="h-5 w-5" />
        <span className="font-heading text-lg font-semibold">
          {average.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">
          {t("count", { count: reviews.length })}
        </span>
      </div>

      <ul className="space-y-3">
        {reviews.map((review) => (
          <li key={review.id}>
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <StarRating value={review.rating} />
                  {review.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-rose">
                      <SealCheck className="h-3 w-3" weight="fill" />{" "}
                      {t("verifiedPurchase")}
                    </span>
                  ) : null}
                </div>
                {review.comment ? (
                  <p className="text-sm">{review.comment}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {format.dateTime(new Date(review.createdAt), {
                    dateStyle: "long",
                  })}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
