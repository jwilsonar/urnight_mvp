import { MapPin, SealCheck } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { LocalResponse } from "@urnight/contracts";
import { Card, CardContent, cn } from "@urnight/ui";
import {
  VERIFIED_TONE_STYLES,
  type VerifiedTone,
} from "@/components/locals/verified-tone";
import { StorageImage } from "@/lib/storage/storage-context";

export function LocalCard({
  local,
  verifiedTone,
}: {
  local: LocalResponse;
  verifiedTone?: VerifiedTone;
}) {
  const t = useTranslations("locals.card");
  const href = `/locals/${local.slug}`;
  const initial = local.name.trim().charAt(0).toLocaleUpperCase();
  const verified =
    local.verificationStatus === undefined
      ? local.isVerified
      : local.verificationStatus === "approved";
  // Temporal: un tono explícito activa la muestra visual de las cuatro cards
  // del home. Sin la prop, la card respeta exclusivamente el estado real.
  const showVerifiedBadge = verified || verifiedTone !== undefined;
  const verifiedToneStyles = VERIFIED_TONE_STYLES[verifiedTone ?? "green"];

  return (
    <div className="group relative h-full rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <Card className="relative flex h-full cursor-pointer flex-col overflow-hidden transition-colors duration-300 group-hover:border-accent-border group-focus-within:border-accent-border motion-reduce:transition-none">
        <span
          aria-hidden="true"
          className="rv-catalog-card-hover pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 ease-[var(--ease-brand)] group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
        />

        <div className="rv-zoom-img relative aspect-[4/3] overflow-visible">
          <div className="absolute inset-0 overflow-hidden">
            {local.mainImageUrl ? (
              <StorageImage
                src={local.mainImageUrl}
                alt={t("facadeNamed", { name: local.name })}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105"
              />
            ) : (
              <div className="rv-img-ph absolute inset-0">
                <span>{t("facade")}</span>
              </div>
            )}
          </div>

          <div
            className="absolute bottom-0 left-4 z-10 flex size-14 translate-y-1/2 items-center justify-center rounded-md border border-accent-border bg-card font-display text-2xl font-black text-primary"
            aria-label={showVerifiedBadge ? t("verified") : t("notVerified")}
          >
            {initial}
            {showVerifiedBadge ? (
              <SealCheck
                className={cn(
                  "absolute -bottom-1.5 -right-1.5 size-5 rounded-full ring-2",
                  verifiedToneStyles.badge,
                )}
                weight="fill"
                aria-hidden="true"
              />
            ) : null}
          </div>
        </div>

        <CardContent className="z-[2] flex flex-1 flex-col px-4 pb-4 pt-10">
          <h3 className="line-clamp-1 font-heading text-lg font-extrabold leading-tight tracking-tight">
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:z-20 after:content-['']"
            >
              {local.name}
            </Link>
          </h3>

          {local.address ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" weight="duotone" />
              <span className="line-clamp-1">{local.address}</span>
            </p>
          ) : null}
          {local.description ? (
            <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
              {local.description}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
