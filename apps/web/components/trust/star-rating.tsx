import { Star } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@urnight/ui';

/** Calificación en estrellas (solo lectura). */
export function StarRating({
  value,
  size = 'h-4 w-4',
  className,
}: {
  value: number;
  size?: string;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <div className={cn('flex items-center gap-0.5', className)} role="img" aria-label={`${value.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={cn(size, index <= rounded ? 'text-primary' : 'text-muted-foreground/30')}
          weight={index <= rounded ? 'fill' : 'regular'}
        />
      ))}
    </div>
  );
}
