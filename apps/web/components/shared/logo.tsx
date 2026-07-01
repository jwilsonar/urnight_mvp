import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@urnight/ui';

/**
 * Lockup de marca UrNight (patrón .un-logo del DS): copa amatista + wordmark
 * blanco extrabold. El asset vive en public/brand/urnight-mark.png.
 */
export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center gap-2.5', className)}
      aria-label="UrNight — inicio"
    >
      <Image
        src="/brand/urnight-mark.png"
        alt=""
        width={22}
        height={36}
        priority
        className="h-9 w-auto"
      />
      <span className="font-heading text-[19px] font-extrabold tracking-tight text-foreground">
        UrNight
      </span>
    </Link>
  );
}
