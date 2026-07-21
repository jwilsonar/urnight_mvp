import Image from "next/image";
import Link from "next/link";
import { cn } from "@urnight/ui";

/** Wordmark principal RAVENUE con enlace al inicio. */
export function Logo({
  className,
  href = "/",
  ariaLabel = "RAVENUE — inicio",
}: {
  className?: string;
  href?: string;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center", className)}
      aria-label={ariaLabel}
    >
      <Image
        src="/brand/wordmark.png"
        alt="RAVENUE"
        width={1168}
        height={104}
        priority
        className="h-5 w-auto sm:h-6"
      />
    </Link>
  );
}
