import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@urnight/ui';

/** Wordmark principal RAVENUE con enlace al inicio. */
export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center', className)}
      aria-label="RAVENUE — inicio"
    >
      <Image
        src="/brand/wordmark-white.png"
        alt="RAVENUE"
        width={1151}
        height={86}
        className="h-5 w-auto sm:h-6"
      />
    </Link>
  );
}
