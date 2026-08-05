"use client";

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
      className={cn("inline-flex shrink-0 items-center gap-2", className)}
      aria-label={ariaLabel}
      data-rv-logo-lockup
    >
      <span
        aria-hidden="true"
        className="inline-flex shrink-0"
        data-rv-logo-icon
      >
        <Image
          src="/brand/icon-mark-light.png"
          alt=""
          width={831}
          height={688}
          priority
          className="h-6 w-auto dark:hidden xl:h-7"
        />
        <Image
          src="/brand/icon-mark.png"
          alt=""
          width={831}
          height={681}
          priority
          className="hidden h-6 w-auto dark:block xl:h-7"
        />
      </span>
      <span className="inline-flex shrink-0" data-rv-logo-wordmark>
        <Image
          src="/brand/wordmark-light.png"
          alt="RAVENUE"
          width={1611}
          height={121}
          priority
          className="h-[13px] w-auto dark:hidden xl:h-3.5"
        />
        <Image
          src="/brand/wordmark.png"
          alt="RAVENUE"
          width={1611}
          height={121}
          priority
          className="hidden h-[13px] w-auto dark:block xl:h-3.5"
        />
      </span>
    </Link>
  );
}
