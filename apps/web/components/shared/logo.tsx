import Link from 'next/link';
import { cn } from '@urnight/ui';

/** Wordmark UrNight. Usa la tipografía de títulos y el color primario del preset. */
export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn('font-heading text-xl font-bold tracking-tight', className)}
      aria-label="UrNight — inicio"
    >
      Ur<span className="text-primary">Night</span>
    </Link>
  );
}
