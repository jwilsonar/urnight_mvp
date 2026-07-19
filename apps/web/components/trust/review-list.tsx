import { ChatCircle, SealCheck } from '@phosphor-icons/react/dist/ssr';
import type { ReviewResponse } from '@urnight/contracts';
import { Card, CardContent } from '@urnight/ui';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDateOnly } from '@/lib/utils';
import { StarRating } from './star-rating';

export function ReviewList({ reviews }: { reviews: ReviewResponse[] }) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<ChatCircle weight="duotone" />}
        title="Aún no hay reseñas"
        description="¡Sé el primero en opinar!"
      />
    );
  }

  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StarRating value={average} size="h-5 w-5" />
        <span className="font-heading text-lg font-semibold">{average.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">
          ({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})
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
                    <span className="inline-flex items-center gap-1 text-xs text-lavender">
                      <SealCheck className="h-3 w-3" weight="fill" /> Compra verificada
                    </span>
                  ) : null}
                </div>
                {review.comment ? <p className="text-sm">{review.comment}</p> : null}
                <p className="text-xs text-muted-foreground">{formatDateOnly(review.createdAt)}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
