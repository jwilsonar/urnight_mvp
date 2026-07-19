import Link from 'next/link';
import { cn } from '@urnight/ui';

/**
 * Lockup principal RAVENUE: V intervenida + wordmark con el enlace "VE"
 * destacado entre RAVE y VENUE.
 */
export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center gap-2.5', className)}
      aria-label="RAVENUE — inicio"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 36 36"
        className="h-9 w-9 shrink-0 text-primary"
        fill="none"
      >
        <path
          d="M5 6 16 29 27 6M27 6l6-4"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
      <span className="font-display text-[19px] font-bold tracking-[0.16em] text-foreground">
        RA<span className="text-[var(--rv-rose)]">VE</span>NUE
      </span>
    </Link>
  );
}
